import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';
import { hasLlmKey } from '@/lib/runtime/executor';

export async function GET(request: Request) {
  return withDemoApi(request, async ({ store, user }) => {
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
  });
}

export async function POST(request: Request) {
  return withDemoApi(request, async ({ store, user }) => {
    const body = await request.json();
    const plan = body.plan as PlanTier;
    if (!PLAN_LIMITS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    store.setPlan(user.id, plan);
    return NextResponse.json({ plan, limits: PLAN_LIMITS[plan] });
  });
}
