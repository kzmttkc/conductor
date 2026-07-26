import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { DemoStore } from '@/lib/demo/store';
import { getStoreForRequest, persistStoreToResponse } from '@/lib/demo/persist';

type DemoUser = { id: string; email: string; name: string };

export async function withDemoApi(
  request: Request,
  handler: (ctx: {
    store: DemoStore;
    user: DemoUser;
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const store = getStoreForRequest(request);
  const res = await handler({ store, user });
  persistStoreToResponse(res, store, user.id);
  return res;
}
