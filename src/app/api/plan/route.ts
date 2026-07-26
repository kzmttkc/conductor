import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';
import { hasLlmKey } from '@/lib/runtime/executor';
import * as data from '@/lib/supabase/data';

export async function GET(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const plan = store.getPlan(user.id);
      const limits = PLAN_LIMITS[plan];
      const usage = store.usage;
      return NextResponse.json({
        plan,
        limits,
        agentCount: store.listAgents(user.id).length,
        onboarded: store.isOnboarded(user.id),
        usage,
        soft_limit: {
          runs: usage.agentRuns >= limits.maxAgentRuns,
          tokens: usage.tokensApprox >= limits.maxTokensApprox,
        },
        hard_cap: {
          runs: Math.ceil(limits.maxAgentRuns * 1.2),
          tokens: Math.ceil(limits.maxTokensApprox * 1.2),
        },
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

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = await data.getPlan(user.id);
  const agents = await data.listAgentsForUser(user.id);
  const usage = await data.getUsage(user.id);
  const limits = PLAN_LIMITS[plan];
  return NextResponse.json({
    plan,
    limits,
    agentCount: agents.length,
    onboarded: agents.length > 0,
    usage,
    soft_limit: {
      runs: usage.agentRuns >= limits.maxAgentRuns,
      tokens: usage.tokensApprox >= limits.maxTokensApprox,
    },
    hard_cap: {
      runs: Math.ceil(limits.maxAgentRuns * 1.2),
      tokens: Math.ceil(limits.maxTokensApprox * 1.2),
    },
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
  const body = await request.json();
  const plan = body.plan as PlanTier;
  if (!PLAN_LIMITS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      store.setPlan(user.id, plan);
      return NextResponse.json({ plan, limits: PLAN_LIMITS[plan] });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Paid plans should go through Stripe; allow free downgrade / admin-style set when no Stripe
  await data.setPlan(user.id, plan);
  return NextResponse.json({ plan, limits: PLAN_LIMITS[plan] });
}
