import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const artifact = getDemoStore().getArtifact(id);
  if (!artifact || artifact.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(artifact);
}
