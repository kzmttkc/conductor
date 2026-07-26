import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/config';
import {
  createVisitorId,
  DEMO_SESSION_COOKIE,
  visitorFromSession,
} from '@/lib/demo/session';
import { DemoStore } from '@/lib/demo/store';
import { persistStoreToResponse } from '@/lib/demo/persist';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';
import { clipTheme } from '@/lib/security/validate';
import { slog } from '@/lib/runtime/observability';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SOLO_SCOUT_ID = '33333333-3333-4333-8333-333333333333';

/**
 * One-click public demo (serverless-safe):
 * - Fresh visitor cookie + state cookie
 * - Await Scout until Needs You (or complete) before responding
 */
export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: 'Public demo requires Demo Mode (NEXT_PUBLIC_DEMO_MODE=true)' },
      { status: 400 }
    );
  }

  const rl = rateLimit(`public-start:${clientKey(request)}`, {
    limit: 8,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) {
    slog('rate_limit', { route: 'public-start' });
    return NextResponse.json(
      { error: 'Too many demo starts from this network. Try again shortly.', code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  const body = await request.json().catch(() => ({}));
  const theme = clipTheme(body.theme || 'AI agent orchestration market 2026');
  const visitorId = createVisitorId();
  const user = visitorFromSession(visitorId)!;

  // Fresh per-visitor store (cookie-backed on Vercel)
  const store = new DemoStore();
  store.markOnboarded(user.id);

  const agents = await store.launchTemplateAndRun(user.id, SOLO_SCOUT_ID, theme);

  // Ensure escalation has time to land if runtime returned early
  const pending = store.listEscalations(user.id, 'pending');

  const res = NextResponse.json({
    ok: true,
    visitorId,
    agents,
    pendingEscalations: pending.length,
    next:
      pending[0]
        ? `/escalations/${pending[0].id}?tour=1&src=public-demo`
        : '/dashboard?tour=1&src=public-demo',
  });

  res.cookies.set(DEMO_SESSION_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.VERCEL === '1',
  });
  persistStoreToResponse(res, store, user.id);

  return res;
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/demo/public-start',
    method: 'POST',
    description: 'One-click public demo bootstrap (awaits Needs You)',
  });
}
