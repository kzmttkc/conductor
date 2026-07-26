import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import type { PlanTier } from '@/lib/supabase/types';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;

  if (!secret || !key) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 400 });
  }

  const stripe = new Stripe(key);
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan as PlanTier | undefined;
    // Demo store can reflect plan for local dogfooding; prod would update profiles table.
    if (plan && isDemoMode()) {
      const userId = session.metadata?.userId;
      if (userId) getDemoStore().setPlan(userId, plan);
    }
  }

  return NextResponse.json({ received: true });
}
