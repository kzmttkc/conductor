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
import { useLocale, useT } from '@/i18n/locale-context';
import {
  formatArtifactKind,
  formatArtifactTitle,
  localizeReportMarkdown,
  reportHasLanguageFallback,
} from '@/i18n/format-content';
import { readAgentLabelsJa } from '@/i18n/agent-labels-client';

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/artifacts/${params.id}`);
      if (!res.ok) {
        setError(t('results.notFound'));
        return;
      }
      setArtifact(await res.json());
    })();
  }, [params.id, t]);

  if (error) {
    return (
      <div className="max-w-md space-y-4 py-12">
        <p className="text-muted-foreground">{t('results.notFoundBody')}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/results">{t('results.viewAll')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{t('results.backDash')}</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (!artifact) {
    return (
      <div className="flex items-center text-muted-foreground py-16">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t('results.loadingReport')}
      </div>
    );
  }

  const languageFallback = reportHasLanguageFallback(artifact.content_markdown, t);

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/agents/${artifact.agent_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('results.backToAgent')}
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {formatArtifactKind(artifact.kind, t)} ·{' '}
            {formatRelativeTime(artifact.created_at, locale)}
          </p>
          <h1 className="font-display text-4xl tracking-tight mt-2">
            {formatArtifactTitle(artifact.title, t, {
              customMap: readAgentLabelsJa(),
            })}
          </h1>
          {languageFallback && (
            <p className="mt-3 text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100 max-w-xl">
              <span className="font-medium">{t('results.languageFallbackBadge')}</span>
              {' — '}
              {t('results.languageFallbackHint')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(
                localizeReportMarkdown(artifact.content_markdown, t)
              );
              toast.success(t('results.copied'));
            }}
          >
            <Copy className="h-4 w-4" />
            {t('results.copy')}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/results">{t('results.all')}</Link>
          </Button>
        </div>
      </div>
      <article className="surface rounded-2xl p-6 md:p-8">
        <p className="text-xs text-muted-foreground mb-4">{t('results.deliverableBlurb')}</p>
        <MarkdownReport markdown={localizeReportMarkdown(artifact.content_markdown, t)} />
      </article>
    </div>
  );
}
