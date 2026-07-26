'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
      toast.success('Checkout complete — your plan will update shortly.');
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
    if (!confirm('Clear all agents, logs, reports, and Needs You items?')) return;
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
          Manage your plan, usage, and billing.
        </p>
        <Link
          href="/templates"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors"
        >
          Templates →
          <span className="text-muted-foreground font-normal">Launch another crew</span>
        </Link>
      </div>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">Current usage</h2>
        <p className="text-sm text-muted-foreground">
          {loading
            ? 'Loading…'
            : `${PLAN_LIMITS[plan].label} plan · ${agentCount} of ${PLAN_LIMITS[plan].maxAgents} agents in use`}
        </p>
        {usage && <UsageMeters plan={plan} usage={usage} agentCount={agentCount} />}
        {usage && (
          <p className="text-xs text-muted-foreground">
            Tool calls this period: {usage.toolCalls}
          </p>
        )}
        {runtime && (
          <p className="text-xs text-muted-foreground pt-1">
            AI mode:{' '}
            {runtime.llmEnabled
              ? `Connected (${runtime.provider})`
              : 'Structured responses with web search'}
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
          Paid plans open secure checkout. Your plan updates automatically after
          payment.
        </p>
        <Accordion type="single" collapsible>
          <AccordionItem value="developer" className="border-none">
            <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
              Developer details
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Stripe Checkout requires <code>STRIPE_SECRET_KEY</code> and price
                IDs in your environment.
              </p>
              <p>
                Webhook endpoint: <code>/api/stripe/webhook</code>
              </p>
              <p>
                LLM providers: set <code>OPENAI_API_KEY</code> or{' '}
                <code>ANTHROPIC_API_KEY</code> for live model calls.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="surface rounded-xl p-5 space-y-3">
        <h2 className="font-medium">Reset workspace</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Clear all agents, logs, reports, and Needs You items to start fresh.
        </p>
        <Button variant="destructive" onClick={resetDemo} disabled={resetting}>
          {resetting ? 'Resetting…' : 'Reset demo floor'}
        </Button>
      </section>
    </div>
  );
}
