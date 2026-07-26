import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';
import { hasLlmKey } from '@/lib/runtime/executor';

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const store = getDemoStore();
  const plan = store.getPlan(user.id);
  return NextResponse.json({
    plan,
    limits: PLAN_LIMITS[plan],
    agentCount: store.listAgents(user.id).length,
    onboarded: store.isOnboarded(user.id),
    usage: store.usage,
    runtime: {
      llmEnabled: hasLlmKey(),
      provider: process.env.ANTHROPIC_API_KEY
        ? 'anthropic'
        : process.env.OPENAI_API_KEY
          ? 'openai'
          : 'structured',
    },
  });
}

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const plan = body.plan as PlanTier;
  if (!PLAN_LIMITS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  const store = getDemoStore();
  store.setPlan(user.id, plan);
  return NextResponse.json({ plan, limits: PLAN_LIMITS[plan] });
}
