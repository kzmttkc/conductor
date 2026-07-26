import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import type { PlanTier } from '@/lib/supabase/types';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';
import {
  claimStripeEvent,
  releaseStripeEvent,
} from '@/lib/stripe/webhook-idempotency';
import { slog } from '@/lib/runtime/observability';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;

  if (!secret || !key) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 400 });
  }

  const stripe = new Stripe(key);
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    slog('stripe.webhook', { ok: false, reason: 'missing_signature' });
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    slog('stripe.webhook', { ok: false, reason: 'bad_signature', message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!claimStripeEvent(event.id)) {
    slog('stripe.webhook', { ok: true, duplicate: true, eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan as PlanTier | undefined;
      const userId = session.metadata?.userId;

      if (!plan || !PLAN_LIMITS[plan] || !userId) {
        slog('stripe.webhook', {
          ok: false,
          reason: 'missing_metadata',
          eventId: event.id,
        });
        // Acknowledge — retrying won't help without metadata
        return NextResponse.json({ received: true, skipped: true });
      }

      if (isDemoMode()) {
        getDemoStore().setPlan(userId, plan);
        slog('stripe.webhook', { ok: true, mode: 'demo', userId, plan, eventId: event.id });
      } else if (!hasAdminClient()) {
        releaseStripeEvent(event.id);
        slog('stripe.webhook', { ok: false, reason: 'no_admin_client', eventId: event.id });
        return NextResponse.json(
          { error: 'Admin client unavailable for plan update' },
          { status: 500 }
        );
      } else {
        const admin = createAdminClient();
        const { data: existing, error: selectErr } = await admin
          .from('usage_stats')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
        if (selectErr) throw selectErr;

        if (existing) {
          const { error } = await admin
            .from('usage_stats')
            .update({ plan })
            .eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await admin
            .from('usage_stats')
            .insert({ user_id: userId, plan });
          if (error) throw error;
        }
        slog('stripe.webhook', { ok: true, mode: 'prod', userId, plan, eventId: event.id });
      }
    } else {
      slog('stripe.webhook', { ok: true, ignored: true, type: event.type, eventId: event.id });
    }
  } catch (err) {
    releaseStripeEvent(event.id);
    const message = err instanceof Error ? err.message : 'Webhook handler failed';
    slog('stripe.webhook', { ok: false, eventId: event.id, message });
    // Retryable — Stripe will redeliver
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
