import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import type { PlanTier } from '@/lib/supabase/types';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';

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
    const userId = session.metadata?.userId;

    if (plan && PLAN_LIMITS[plan] && userId) {
      if (isDemoMode()) {
        getDemoStore().setPlan(userId, plan);
      } else if (hasAdminClient()) {
        const admin = createAdminClient();
        const { data: existing } = await admin
          .from('usage_stats')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
        if (existing) {
          await admin.from('usage_stats').update({ plan }).eq('user_id', userId);
        } else {
          await admin.from('usage_stats').insert({ user_id: userId, plan });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
