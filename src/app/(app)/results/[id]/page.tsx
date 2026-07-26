'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Artifact } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/utils';
import { MarkdownReport } from '@/components/results/MarkdownReport';
import { Button } from '@/components/ui/button';

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/artifacts/${params.id}`);
      if (!res.ok) {
        setError('Report not found');
        return;
      }
      setArtifact(await res.json());
    })();
  }, [params.id]);

  if (error) {
    return (
      <div className="max-w-md space-y-4 py-12">
        <p className="text-muted-foreground">
          This report may have been removed or is no longer available.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/results">View all results</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {artifact.kind} · {formatRelativeTime(artifact.created_at)}
          </p>
          <h1 className="font-display text-4xl tracking-tight mt-2">{artifact.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(artifact.content_markdown);
              toast.success('Report copied');
            }}
          >
            <Copy className="h-4 w-4" />
            Copy report
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/results">All results</Link>
          </Button>
        </div>
      </div>
      <article className="surface rounded-2xl p-6 md:p-8">
        <p className="text-xs text-muted-foreground mb-4">
          Finished deliverable from your agents — ready to share or edit elsewhere.
        </p>
        <MarkdownReport markdown={artifact.content_markdown} />
      </article>
    </div>
  );
}
