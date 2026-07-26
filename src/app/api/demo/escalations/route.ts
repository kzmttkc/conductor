import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';
import type { Escalation } from '@/lib/supabase/types';

export async function GET(request: Request) {
  return withDemoApi(request, async ({ store, user }) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as Escalation['status'] | null;
    return NextResponse.json(
      store.listEscalations(user.id, status ?? undefined)
    );
  });
}
