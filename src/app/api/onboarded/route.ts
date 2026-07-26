import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';

export async function POST(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      store.markOnboarded(user.id);
      return NextResponse.json({ ok: true });
    });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Prod: onboarding is inferred from agent presence; acknowledge for UI.
  return NextResponse.json({ ok: true, userId: user.id });
}
