import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import * as data from '@/lib/supabase/data';
import { launchTemplateProd } from '@/lib/runtime/prod-runner';
import { RuntimeError } from '@/lib/runtime/errors';
import { listBundledTemplates } from '@/lib/templates/catalog';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';
import { clipTheme } from '@/lib/security/validate';
import { slog } from '@/lib/runtime/observability';

export async function GET(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const plan = store.getPlan(user.id);
      return NextResponse.json({
        templates: store.listTemplates(),
        plan,
        limits: PLAN_LIMITS[plan],
        agentCount: store.listAgents(user.id).length,
      });
    });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = await data.getPlan(user.id);
  const agents = await data.listAgentsForUser(user.id);
  return NextResponse.json({
    templates: listBundledTemplates(),
    plan,
    limits: PLAN_LIMITS[plan],
    agentCount: agents.length,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const templateId = String(body.template_id || '');
  const theme = clipTheme(body.theme);
  if (!templateId || !theme) {
    return NextResponse.json({ error: 'template_id and theme required' }, { status: 400 });
  }

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const rl = rateLimit(`launch:${clientKey(request, user.id)}`, {
        limit: 12,
        windowMs: 60_000,
      });
      if (!rl.ok) {
        slog('rate_limit', { route: 'templates', userId: user.id });
        return NextResponse.json(
          { error: 'Too many launches. Try again shortly.', code: 'RATE_LIMIT' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
        );
      }

      const template = store.getTemplate(templateId);
      if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      const current = store.listAgents(user.id).length;
      const needed = template.agent_definitions.length;
      const plan = store.getPlan(user.id);
      const limit = PLAN_LIMITS[plan].maxAgents;
      if (current + needed > limit) {
        return NextResponse.json(
          {
            error: `Plan limit: ${PLAN_LIMITS[plan].label} allows ${limit} agents. This crew needs ${needed} (you have ${current}).`,
            code: 'PLAN_LIMIT',
            plan,
            limit,
            needed,
            current,
            upgrade_to: plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale',
          },
          { status: 403 }
        );
      }
      try {
        store.assertUsageBudget(user.id);
      } catch (e) {
        const err = e as Error & { code?: string; upgrade_to?: string };
        return NextResponse.json(
          { error: err.message, code: 'USAGE_LIMIT', upgrade_to: err.upgrade_to },
          { status: 403 }
        );
      }
      try {
        const agents = await store.launchTemplateAndRun(user.id, templateId, theme);
        store.markOnboarded(user.id);
        return NextResponse.json({ agents }, { status: 201 });
      } catch (e) {
        if (e instanceof RuntimeError && e.code === 'conflict') {
          return NextResponse.json({ error: e.message, code: 'CONFLICT' }, { status: 409 });
        }
        throw e;
      }
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`launch:${clientKey(request, user.id)}`, {
    limit: 12,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    slog('rate_limit', { route: 'templates', userId: user.id });
    return NextResponse.json(
      { error: 'Too many launches. Try again shortly.', code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const plan = await data.getPlan(user.id);
  try {
    const agents = await launchTemplateProd(user.id, templateId, theme, plan);
    return NextResponse.json({ agents }, { status: 201 });
  } catch (e) {
    if (e instanceof RuntimeError && e.code === 'conflict') {
      return NextResponse.json({ error: e.message, code: 'CONFLICT' }, { status: 409 });
    }
    const err = e as Error & { code?: string; upgrade_to?: string };
    const status = err.code === 'PLAN_LIMIT' || err.code === 'USAGE_LIMIT' ? 403 : 400;
    return NextResponse.json(
      { error: err.message, code: err.code, upgrade_to: err.upgrade_to },
      { status }
    );
  }
}
