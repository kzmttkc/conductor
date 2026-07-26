import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/config';
import { createVisitorId, DEMO_SESSION_COOKIE } from '@/lib/demo/session';

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode disabled' }, { status: 400 });
  }

  const visitorId = createVisitorId();
  const res = NextResponse.json({ ok: true, visitorId });
  res.cookies.set(DEMO_SESSION_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
