'use client';

import Link from 'next/link';
import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { useLocale, useT } from '@/i18n/locale-context';

const ORDER: PlanTier[] = ['free', 'starter', 'pro', 'scale'];

export function PricingSection() {
  const t = useT();
  const { locale } = useLocale();

  return (
    <section id="pricing" className="scroll-mt-20 mt-20 sm:mt-28">
      <div className="max-w-xl">
        <h2 className="font-display text-3xl tracking-tight">{t('home.pricingTitle')}</h2>
        <p className="mt-3 text-sm text-[#6b6b66] leading-relaxed">{t('home.pricingBody')}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((tier) => {
          const plan = PLAN_LIMITS[tier];
          const featured = tier === 'pro';
          const ctaHref = tier === 'free' ? '/demo' : '/login';
          const ctaLabel = tier === 'free' ? t('pricing.ctaFree') : t('pricing.ctaPaid');
          return (
            <div
              key={tier}
              className={
                featured
                  ? 'rounded-2xl border border-[#141414] bg-white p-5 shadow-sm flex flex-col'
                  : 'rounded-2xl border border-[#e4e4e0] bg-white/70 p-5 flex flex-col'
              }
            >
              <p className="text-sm font-medium">{t(`plan.${tier}`)}</p>
              <p className="mt-2 font-display text-3xl tracking-tight">
                {plan.price === 0 ? (
                  t('pricing.free')
                ) : (
                  <>
                    ${plan.price}
                    <span className="text-base font-sans font-normal text-[#6b6b66]">
                      {t('pricing.perMo')}
                    </span>
                  </>
                )}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-[#6b6b66] flex-1">
                <li>{t('pricing.agents', { n: plan.maxAgents })}</li>
                <li>
                  {t('pricing.runs', {
                    n: plan.maxAgentRuns.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US'),
                  })}
                </li>
              </ul>
              <Button
                asChild
                variant={featured ? 'default' : 'outline'}
                className="mt-5 w-full min-h-10"
              >
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
