import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS } from '@/lib/supabase/types';

export async function GET(request: Request) {
  return withDemoApi(request, async ({ store, user }) =>
    NextResponse.json(store.listAgents(user.id))
  );
}

export async function POST(request: Request) {
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

    const agent = store.createAgent({
      user_id: user.id,
      name: body.name,
      role: body.role,
      current_task: body.current_task ?? body.goal ?? null,
      permissions: body.permissions ?? {},
      config: body.config ?? {},
      status: body.start ? 'running' : 'idle',
    });

    if (body.start) {
      await store.startRuntime(agent.id);
    }

    return NextResponse.json(store.getAgent(agent.id), { status: 201 });
  });
}
