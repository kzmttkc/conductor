import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import * as data from '@/lib/supabase/data';
import { startProdAgent } from '@/lib/runtime/prod-runner';

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
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'Usage limit', code: 'USAGE_LIMIT' },
          { status: 403 }
        );
      }

      const agent = store.createAgent({
        user_id: user.id,
        name: body.name,
        role: body.role,
        current_task: body.current_task ?? body.goal ?? null,
        permissions: body.permissions ?? {},
        config: body.config ?? {},
        status: body.start ? 'running' : 'idle',
      });
      if (body.start) await store.startRuntime(agent.id);
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
  const agent = await data.createAgentRow({
    user_id: user.id,
    name: body.name,
    role: body.role,
    current_task: body.current_task ?? body.goal ?? null,
    permissions: body.permissions ?? {},
    config: body.config ?? {},
    status: 'idle',
  });
  if (body.start) await startProdAgent(agent.id);
  return NextResponse.json(await data.getAgentForUser(user.id, agent.id), { status: 201 });
}
