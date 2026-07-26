import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/config';
import { createVisitorId, DEMO_SESSION_COOKIE, visitorFromSession } from '@/lib/demo/session';
import { DemoStore } from '@/lib/demo/store';
import { persistStoreToResponse } from '@/lib/demo/persist';

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode disabled' }, { status: 400 });
  }

  const visitorId = createVisitorId();
  const user = visitorFromSession(visitorId)!;
  const store = new DemoStore();
  const res = NextResponse.json({ ok: true, visitorId });
  res.cookies.set(DEMO_SESSION_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.VERCEL === '1',
  });
  persistStoreToResponse(res, store, user.id);
  return res;
}
