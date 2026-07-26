import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/config';
import { getDemoStore } from '@/lib/demo/store';
import {
  createVisitorId,
  DEMO_SESSION_COOKIE,
  visitorFromSession,
} from '@/lib/demo/session';

const SOLO_SCOUT_ID = '33333333-3333-4333-8333-333333333333';

/**
 * One-click public demo:
 * - Creates an isolated visitor session
 * - Clears that visitor's prior agents only
 * - Launches Solo Scout so a Needs You moment arrives quickly
 */
export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: 'Public demo requires Demo Mode (NEXT_PUBLIC_DEMO_MODE=true)' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const theme = String(body.theme || 'AI agent orchestration market 2026').slice(0, 160);
  const visitorId = createVisitorId();
  const user = visitorFromSession(visitorId)!;
  const store = getDemoStore();

  // Isolate: delete only this visitor's leftover agents (none on fresh id)
  for (const agent of store.listAgents(user.id)) {
    store.deleteAgent(agent.id);
  }

  store.markOnboarded(user.id);

  const agents = store.launchTemplate(user.id, SOLO_SCOUT_ID, theme);

  const res = NextResponse.json({
    ok: true,
    visitorId,
    agents,
    next: '/dashboard?tour=1&src=public-demo',
  });

  res.cookies.set(DEMO_SESSION_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

export async function GET() {
  // Convenience for link previews / curl health
  return NextResponse.json({
    endpoint: '/api/demo/public-start',
    method: 'POST',
    description: 'One-click public demo bootstrap',
  });
}
