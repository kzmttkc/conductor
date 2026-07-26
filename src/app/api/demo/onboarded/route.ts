import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';

export async function POST(request: Request) {
  return withDemoApi(request, async ({ store, user }) => {
    store.markOnboarded(user.id);
    return NextResponse.json({ ok: true });
  });
}
