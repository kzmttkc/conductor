'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Escalation } from '@/lib/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/locale-context';
import {
  formatEscalationStatus,
  formatEscalationSummary,
} from '@/i18n/format-content';

export default function EscalationsPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const { locale } = useLocale();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/escalations');
        if (!res.ok) {
          if (!cancelled) {
            setError(t('needsYou.loadError'));
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as Escalation[];
        if (!cancelled) {
          setItems(data);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(t('needsYou.loadError'));
          setLoading(false);
        }
      }
    };
    void load();
    const interval = setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [t]);

  const pending = items.filter((e) => e.status === 'pending');
  const resolved = items.filter((e) => e.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight">{t('needsYou.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('needsYou.subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground py-16" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('needsYou.loading')}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border px-6 py-10 text-center space-y-4">
          <p className="font-medium">{error}</p>
          <Button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void fetch('/api/escalations')
                .then(async (res) => {
                  if (!res.ok) throw new Error('fail');
                  setItems(await res.json());
                  setLoading(false);
                })
                .catch(() => {
                  setError(t('needsYou.loadError'));
                  setLoading(false);
                });
            }}
          >
            {t('common.retry')}
          </Button>
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">{t('needsYou.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('needsYou.emptyBody')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/templates">{t('needsYou.launchCrew')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t('needsYou.backDash')}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-urgent">{t('needsYou.needsNow')}</h2>
          {pending.map((item) => (
            <Link key={item.id} href={`/escalations/${item.id}`} className="block">
              <Card className="urgent-ring border-urgent/40 hover:bg-urgent/5 transition-colors">
                <CardContent className="p-5">
                  <p className="font-medium leading-snug">
                    {formatEscalationSummary(item.summary, item.context, t)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatRelativeTime(item.created_at, locale)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t('needsYou.resolved')}</h2>
          {resolved.map((item) => (
            <Link key={item.id} href={`/escalations/${item.id}`} className="block">
              <Card className="bg-card/60 hover:bg-card transition-colors">
                <CardContent className="p-4">
                  <p className="text-sm">
                    {formatEscalationSummary(item.summary, item.context, t)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEscalationStatus(item.status, t)} ·{' '}
                    {formatRelativeTime(item.created_at, locale)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
