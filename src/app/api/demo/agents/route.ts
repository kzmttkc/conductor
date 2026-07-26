import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import { PLAN_LIMITS } from '@/lib/supabase/types';

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getDemoStore().listAgents(user.id));
}

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const store = getDemoStore();
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
    void store.startRuntime(agent.id);
  }

  return NextResponse.json(agent, { status: 201 });
}
