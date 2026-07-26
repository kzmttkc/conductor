import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import * as data from '@/lib/supabase/data';
import { startProdAgent } from '@/lib/runtime/prod-runner';
import { RuntimeError } from '@/lib/runtime/errors';
import { clipText } from '@/lib/security/validate';
import { getServerLocale } from '@/i18n/locale-server';

export async function GET(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) =>
      NextResponse.json(store.listAgents(user.id))
    );
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await data.listAgentsForUser(user.id));
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const body = await request.json();
      const agents = store.listAgents(user.id);
      const plan = store.getPlan(user.id);
      const limit = PLAN_LIMITS[plan].maxAgents;
      if (agents.length >= limit) {
        return NextResponse.json(
          {
            error: `Plan limit: ${PLAN_LIMITS[plan].label} allows ${limit} agents.`,
            code: 'PLAN_LIMIT',
            plan,
            limit,
            upgrade_to: plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale',
          },
          { status: 403 }
        );
      }
      try {
        store.assertUsageBudget(user.id);
      } catch (e) {
        const err = e as Error & { upgrade_to?: string };
        const usageErr = err as Error & {
          upgrade_to?: string;
          plan?: string;
          n?: number;
          metric?: string;
        };
        return NextResponse.json(
          {
            error: usageErr.message,
            code: 'USAGE_LIMIT',
            upgrade_to: usageErr.upgrade_to,
            plan: usageErr.plan ?? plan,
            n: usageErr.n,
            metric: usageErr.metric,
          },
          { status: 403 }
        );
      }

      const locale = await getServerLocale();
      const agent = store.createAgent({
        user_id: user.id,
        name: clipText(body.name, 80) || 'Agent',
        role: clipText(body.role, 80) || 'Operator',
        current_task: clipText(body.current_task ?? body.goal ?? '', 500) || null,
        permissions: body.permissions ?? {},
        config: { ...(body.config ?? {}), locale },
        status: 'idle',
      });
      try {
        if (body.start) await store.startRuntime(agent.id, null, locale);
      } catch (e) {
        if (e instanceof RuntimeError && e.code === 'conflict') {
          return NextResponse.json({ error: e.message, code: 'CONFLICT' }, { status: 409 });
        }
        throw e;
      }
      return NextResponse.json(store.getAgent(agent.id), { status: 201 });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const plan = await data.getPlan(user.id);
  try {
    await data.assertAgentCapacity(user.id, 1, plan);
    await data.assertUsageBudget(user.id, plan);
  } catch (e) {
    const err = e as Error & { code?: string; upgrade_to?: string };
    return NextResponse.json(
      { error: err.message, code: err.code, upgrade_to: err.upgrade_to },
      { status: 403 }
    );
  }
  const locale = await getServerLocale();
  const agent = await data.createAgentRow({
    user_id: user.id,
    name: clipText(body.name, 80) || 'Agent',
    role: clipText(body.role, 80) || 'Operator',
    current_task: clipText(body.current_task ?? body.goal ?? '', 500) || null,
    permissions: body.permissions ?? {},
    config: { ...(body.config ?? {}), locale },
    status: 'idle',
  });
  try {
    if (body.start) await startProdAgent(agent.id, null, locale);
  } catch (e) {
    if (e instanceof RuntimeError && e.code === 'conflict') {
      return NextResponse.json({ error: e.message, code: 'CONFLICT' }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json(await data.getAgentForUser(user.id, agent.id), { status: 201 });
}
