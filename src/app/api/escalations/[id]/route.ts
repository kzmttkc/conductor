import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { inngest } from '@/lib/inngest/client';
import * as data from '@/lib/supabase/data';
import { resumeProdAgent } from '@/lib/runtime/prod-runner';
import { RuntimeError } from '@/lib/runtime/errors';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';
import { validateEscalationBody } from '@/lib/security/validate';
import { slog } from '@/lib/runtime/observability';
import { getServerLocale } from '@/i18n/locale-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const escalation = store.getEscalation(id);
      if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const agent = store.getAgent(escalation.agent_id);
      if (!agent || agent.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({
        escalation,
        agent,
        logs: store.listLogs(agent.id),
      });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data: escalation } = await supabase
    .from('escalations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const agent = await data.getAgentForUser(user.id, escalation.agent_id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    escalation,
    agent,
    logs: await data.listLogs(agent.id),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = validateEscalationBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { action, human_response: humanResponse } = parsed;

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const rl = rateLimit(`resolve:${clientKey(request, user.id)}`, {
        limit: 30,
        windowMs: 60_000,
      });
      if (!rl.ok) {
        slog('rate_limit', { route: 'escalations', userId: user.id });
        return NextResponse.json(
          { error: 'Too many decisions. Try again shortly.', code: 'RATE_LIMIT' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
        );
      }

      const escalation = store.getEscalation(id);
      if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const agent = store.getAgent(escalation.agent_id);
      if (!agent || agent.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (escalation.status !== 'pending') {
        return NextResponse.json(
          { ...escalation, next_pending_ids: store.listEscalations(user.id, 'pending').map((e) => e.id) },
          { status: 200 }
        );
      }

      const updated = store.resolveEscalation(id, action, humanResponse);
      if (updated && action !== 'cancel') {
        try {
          const locale = await getServerLocale();
          await store.resumeAgent(updated.agent_id, humanResponse, locale);
        } catch (e) {
          if (e instanceof RuntimeError && e.code === 'conflict') {
            return NextResponse.json(
              { error: e.message, code: 'CONFLICT', ...updated },
              { status: 409 }
            );
          }
          throw e;
        }
        try {
          await inngest.send({
            name: 'conductor/escalation.resolved',
            data: {
              agentId: updated.agent_id,
              escalationId: updated.id,
              humanResponse,
              action,
            },
          });
        } catch {
          // optional
        }
      }
      const remaining = store.listEscalations(user.id, 'pending').map((e) => e.id);
      return NextResponse.json({ ...updated, next_pending_ids: remaining });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`resolve:${clientKey(request, user.id)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    slog('rate_limit', { route: 'escalations', userId: user.id });
    return NextResponse.json(
      { error: 'Too many decisions. Try again shortly.', code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const supabase = await (await import('@/lib/supabase/server')).createClient();
  const { data: existing } = await supabase
    .from('escalations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const agent = await data.getAgentForUser(user.id, existing.agent_id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (existing.status !== 'pending') {
    const remaining = (await data.listPendingEscalations(user.id)).map((e) => e.id);
    return NextResponse.json({ ...existing, next_pending_ids: remaining });
  }

  const updated = await data.resolveEscalationRow(id, action, humanResponse);
  if (!updated) {
    const remaining = (await data.listPendingEscalations(user.id)).map((e) => e.id);
    return NextResponse.json({ ...existing, next_pending_ids: remaining });
  }

  if (action === 'cancel') {
    await data.updateAgent(agent.id, {
      status: 'idle',
      current_task: 'Stopped by user',
    });
    await data.insertLog(agent.id, 'action', `Cancelled by human: ${humanResponse}`, {
      i18nKey: 'log.cancelledByHuman',
      i18nParams: { response: humanResponse },
    });
  } else {
    await data.insertLog(
      agent.id,
      'action',
      `Human ${action === 'approve' ? 'approved' : 'revised'}: ${humanResponse}`,
      {
        i18nKey: action === 'approve' ? 'log.humanApproved' : 'log.humanRevised',
        i18nParams: { response: humanResponse },
      }
    );
    try {
      const locale = await getServerLocale();
      await resumeProdAgent(agent.id, humanResponse, locale);
    } catch (e) {
      if (e instanceof RuntimeError && e.code === 'conflict') {
        return NextResponse.json(
          { error: e.message, code: 'CONFLICT', ...updated },
          { status: 409 }
        );
      }
      throw e;
    }
  }

  const remaining = (await data.listPendingEscalations(user.id)).map((e) => e.id);
  return NextResponse.json({ ...updated, next_pending_ids: remaining });
}
