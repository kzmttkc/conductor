'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Artifact } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/utils';

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/demo/artifacts/${params.id}`);
      if (!res.ok) {
        setError('Report not found');
        return;
      }
      setArtifact(await res.json());
    })();
  }, [params.id]);

  if (error) return <p className="text-muted-foreground">{error}</p>;
  if (!artifact) {
    return (
      <div className="flex items-center text-muted-foreground py-16">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading report…
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/agents/${artifact.agent_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to agent
      </Link>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {artifact.kind} · {formatRelativeTime(artifact.created_at)}
        </p>
        <h1 className="font-display text-4xl tracking-tight mt-2">{artifact.title}</h1>
      </div>
      <article className="surface rounded-2xl p-6 md:p-8 prose-report">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-sans">
          {artifact.content_markdown}
        </pre>
      </article>
    </div>
  );
}
