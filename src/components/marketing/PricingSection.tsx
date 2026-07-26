import Link from 'next/link';
import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';

const ORDER: PlanTier[] = ['free', 'starter', 'pro', 'scale'];

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 mt-20 sm:mt-28">
      <div className="max-w-xl">
        <h2 className="font-display text-3xl tracking-tight">Pricing</h2>
        <p className="mt-3 text-sm text-[#6b6b66] leading-relaxed">
          Start free. Upgrade when the crew grows. Limits apply to agents and
          approximate monthly runs.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((tier) => {
          const plan = PLAN_LIMITS[tier];
          const featured = tier === 'pro';
          return (
            <div
              key={tier}
              className={
                featured
                  ? 'rounded-2xl border border-[#141414] bg-white p-5 shadow-sm'
                  : 'rounded-2xl border border-[#e4e4e0] bg-white/70 p-5'
              }
            >
              <p className="text-sm font-medium">{plan.label}</p>
              <p className="mt-2 font-display text-3xl tracking-tight">
                {plan.price === 0 ? (
                  'Free'
                ) : (
                  <>
                    ${plan.price}
                    <span className="text-base font-sans font-normal text-[#6b6b66]">
                      /mo
                    </span>
                  </>
                )}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-[#6b6b66]">
                <li>{plan.maxAgents} agents</li>
                <li>~{plan.maxAgentRuns.toLocaleString()} runs / period</li>
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Button asChild className="min-h-11">
          <Link href="/demo">Try live demo — no signup</Link>
        </Button>
      </div>
    </section>
  );
}
