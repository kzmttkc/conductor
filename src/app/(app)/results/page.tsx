'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2 } from 'lucide-react';
import type { Artifact } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatRelativeTime } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/locale-context';
import {
  formatArtifactKind,
  formatArtifactTitle,
  reportHasLanguageFallback,
} from '@/i18n/format-content';
import { readAgentLabelsJa } from '@/i18n/agent-labels-client';

export default function ResultsIndexPage() {
  const [items, setItems] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const t = useT();
  const { locale } = useLocale();

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/artifacts');
        if (!res.ok) {
          throw new Error(t('results.loadError'));
        }
        setItems(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : t('results.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('results.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('results.subtitle')}</p>
      </div>

      {!loading && !error && items.length > 0 && (
        <Input
          type="search"
          placeholder={t('results.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
          aria-label={t('results.search')}
        />
      )}

      {loading ? (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('results.loading')}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-urgent/40 bg-urgent/5 px-6 py-8 text-center">
          <p className="font-medium text-urgent">{error}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('results.loadErrorHint')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">{t('results.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('results.emptyBody')}</p>
          <Link href="/templates" className="text-sm font-medium mt-4 inline-block underline">
            {t('results.launch')}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t('results.noMatch', { q: query })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Link key={item.id} href={`/results/${item.id}`} className="block">
              <Card className="hover:bg-card transition-colors bg-card/80">
                <CardContent className="p-5 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-success mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {formatArtifactTitle(item.title, t, {
                        customMap: readAgentLabelsJa(),
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(item.created_at, locale)} ·{' '}
                      {formatArtifactKind(item.kind, t)}
                      {reportHasLanguageFallback(item.content_markdown, t) && (
                        <>
                          {' · '}
                          <span className="text-amber-700 dark:text-amber-300">
                            {t('results.languageFallbackBadge')}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
