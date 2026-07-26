import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import * as data from '@/lib/supabase/data';

export async function POST(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      store.resetUser(user.id);
      return NextResponse.json({ ok: true });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agents = await data.listAgentsForUser(user.id);
  for (const a of agents) {
    await data.deleteAgent(user.id, a.id);
  }
  return NextResponse.json({ ok: true });
}
