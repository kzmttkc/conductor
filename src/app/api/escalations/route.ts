import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import type { Escalation } from '@/lib/supabase/types';
import * as data from '@/lib/supabase/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as Escalation['status'] | null;

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) =>
      NextResponse.json(store.listEscalations(user.id, status ?? undefined))
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(
    await data.listEscalationsForUser(user.id, status ?? undefined)
  );
}
