import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { APP_URL, isDemoMode } from '@/lib/config';
import { getStripePriceId, isStripeConfigured } from '@/lib/stripe';
import type { PlanTier } from '@/lib/supabase/types';
import { getDemoStore } from '@/lib/demo/store';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const plan = body.plan as PlanTier;
  const priceId = getStripePriceId(plan);

  if (!isStripeConfigured() || !priceId || !process.env.STRIPE_SECRET_KEY) {
    // Demo / local: allow UI to fall back to instant plan switch
    if (isDemoMode()) {
      return NextResponse.json({ demo: true, plan });
    }
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/settings?checkout=success&plan=${plan}`,
    cancel_url: `${APP_URL}/settings?checkout=cancel`,
    customer_email: user.email || undefined,
    metadata: {
      userId: user.id,
      plan,
    },
  });

  return NextResponse.json({ url: session.url });
}

/** Instant demo upgrade helper used after successful checkout stub */
export async function PUT(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const store = getDemoStore();
  store.setPlan(user.id, body.plan);
  return NextResponse.json({ plan: store.getPlan(user.id) });
}
