import { PLAN_LIMITS, type PlanTier } from '@/lib/supabase/types';

/** Stripe Checkout stub — wire to real Stripe when keys are present. */
export function getStripePriceId(plan: PlanTier): string | null {
  if (plan === 'free') return null;
  const map: Record<Exclude<PlanTier, 'free'>, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    scale: process.env.STRIPE_PRICE_SCALE,
  };
  return map[plan] ?? null;
}

export function describePlan(plan: PlanTier) {
  return PLAN_LIMITS[plan];
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}
