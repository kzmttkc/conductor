import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import * as data from '@/lib/supabase/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const artifact = store.getArtifact(id);
      if (!artifact || artifact.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(artifact);
    });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const artifact = await data.getArtifactForUser(user.id, id);
  if (!artifact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(artifact);
}
