import { NextResponse } from 'next/server';
import { withDemoApi } from '@/lib/demo/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withDemoApi(request, async ({ store, user }) => {
    const { id } = await params;
    const artifact = store.getArtifact(id);
    if (!artifact || artifact.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(artifact);
  });
}
