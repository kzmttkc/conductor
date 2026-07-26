'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UsageMeters } from '@/components/usage/UsageMeters';
import { PLAN_LIMITS, type PlanTier, type UsageStats } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const plans: PlanTier[] = ['free', 'starter', 'pro', 'scale'];

export default function SettingsPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanTier>('free');
  const [agentCount, setAgentCount] = useState(0);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [runtime, setRuntime] = useState<{ llmEnabled: boolean; provider: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  async function refresh() {
    const res = await fetch('/api/plan');
    if (res.ok) {
      const data = await res.json();
      setPlan(data.plan);
      setAgentCount(data.agentCount);
      setUsage(data.usage);
      setRuntime(data.runtime);
    }
    setLoading(false);
  }

  // Surface Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast.success('Checkout complete — plan updates when the webhook lands.');
      void refresh();
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, []);

  async function choose(next: PlanTier) {
    // Prefer Stripe Checkout when configured
    if (next !== 'free') {
      const stripeRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      });
      if (stripeRes.ok) {
        const data = await stripeRes.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (data.demo) {
          // fall through to local plan switch
        }
      }
    }

    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: next }),
    });
    if (!res.ok) {
      toast.error('Could not update plan');
      return;
    }
    setPlan(next);
    toast.success(
      next === 'free'
        ? 'Switched to Free'
        : `${PLAN_LIMITS[next].label} activated (demo billing)`
    );
  }

  async function resetDemo() {
    if (!confirm('Clear all agents, logs, reports, and escalations?')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      await refresh();
      toast.success('Demo floor cleared');
      router.push('/onboarding');
      router.refresh();
    } catch {
      toast.error('Could not reset demo');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Plans, usage, and runtime. Stripe Checkout runs when keys are configured.
        </p>
      </div>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">Current usage</h2>
        <p className="text-sm text-muted-foreground">
          {loading
            ? 'Loading…'
            : `${PLAN_LIMITS[plan].label} · soft caps enforce runs & tokens before upgrade`}
        </p>
        {usage && <UsageMeters plan={plan} usage={usage} agentCount={agentCount} />}
        {usage && (
          <p className="text-xs text-muted-foreground">
            Tool calls this period: {usage.toolCalls}
          </p>
        )}
        {runtime && (
          <p className="text-xs text-muted-foreground pt-1">
            Runtime:{' '}
            {runtime.llmEnabled
              ? `LLM (${runtime.provider})`
              : 'Structured + web search (set OPENAI_API_KEY or ANTHROPIC_API_KEY for real LLM)'}
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {plans.map((p) => {
          const meta = PLAN_LIMITS[p];
          const active = plan === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => choose(p)}
              className={cn(
                'text-left rounded-xl border p-5 transition-all',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card hover:border-foreground/30'
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">{meta.label}</p>
                <p className="text-sm">
                  {meta.price === 0 ? '$0' : `$${meta.price}`}
                  {meta.price > 0 && (
                    <span className={active ? 'opacity-70' : 'text-muted-foreground'}>
                      /mo
                    </span>
                  )}
                </p>
              </div>
              <p className={`text-sm mt-2 ${active ? 'opacity-80' : 'text-muted-foreground'}`}>
                Up to {meta.maxAgents} agents · ~{meta.maxAgentRuns} runs / mo
              </p>
              {active && <p className="text-xs mt-3 opacity-70">Current plan</p>}
            </button>
          );
        })}
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">Billing</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          With <code className="text-xs">STRIPE_SECRET_KEY</code> + price IDs, plan
          clicks open Stripe Checkout. Webhook at{' '}
          <code className="text-xs">/api/stripe/webhook</code> updates the plan.
        </p>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">Dogfood reset</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Clear the floor and run a crew again.
        </p>
        <Button variant="destructive" onClick={resetDemo} disabled={resetting}>
          {resetting ? 'Resetting…' : 'Reset demo floor'}
        </Button>
      </section>
    </div>
  );
}
