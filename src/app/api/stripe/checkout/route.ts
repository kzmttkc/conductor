import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { APP_URL, isDemoMode } from '@/lib/config';
import { getStripePriceId, isStripeConfigured } from '@/lib/stripe';
import type { PlanTier } from '@/lib/supabase/types';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import { getDemoStore } from '@/lib/demo/store';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { plan?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const plan = body.plan as PlanTier;
  if (!plan || !PLAN_LIMITS[plan]) {
    return NextResponse.json(
      { error: 'Invalid plan. Use free | starter | pro | scale.' },
      { status: 400 }
    );
  }

  const priceId = getStripePriceId(plan);

  if (!isStripeConfigured() || !priceId || !process.env.STRIPE_SECRET_KEY) {
    if (isDemoMode()) {
      return NextResponse.json({ demo: true, plan });
    }
    return NextResponse.json(
      {
        error:
          'Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs, or use Demo Mode.',
        code: 'STRIPE_NOT_CONFIGURED',
      },
      { status: 400 }
    );
  }

  if (plan === 'free') {
    return NextResponse.json(
      { error: 'Checkout is for paid plans only. Use Settings to switch to Free.' },
      { status: 400 }
    );
  }

  try {
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

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL', code: 'CHECKOUT_NO_URL' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout session failed';
    return NextResponse.json(
      { error: message, code: 'CHECKOUT_FAILED' },
      { status: 502 }
    );
  }
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
