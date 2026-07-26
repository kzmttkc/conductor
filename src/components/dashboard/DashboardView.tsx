'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Play, Radio } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useEscalations } from '@/hooks/useEscalations';
import { Button } from '@/components/ui/button';
import { PublicDemoTour } from '@/components/demo/PublicDemoTour';
import { SortableAgentGrid } from '@/components/dashboard/SortableAgentGrid';
import type { Artifact, Escalation } from '@/lib/supabase/types';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useLocale, useT } from '@/i18n/locale-context';
import { formatArtifactTitle, formatEscalationSummary } from '@/i18n/format-content';
import { readAgentLabelsJa } from '@/i18n/agent-labels-client';

export function DashboardView({ userId }: { userId: string }) {
  const { agents, loading } = useAgents(userId);
  const { escalations } = useEscalations(userId);
  const [reportAgentIds, setReportAgentIds] = useState<Set<string>>(new Set());
  const [recentArtifacts, setRecentArtifacts] = useState<Artifact[]>([]);
  const [customMap, setCustomMap] = useState<Record<string, string>>({});
  const t = useT();
  const { locale } = useLocale();

  useEffect(() => {
    setCustomMap(readAgentLabelsJa());
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/artifacts');
      if (!res.ok) return;
      const data = (await res.json()) as Artifact[];
      setReportAgentIds(new Set(data.map((a) => a.agent_id)));
      setRecentArtifacts(data.slice(0, 3));
    })();
  }, [agents]);

  const running = agents.filter((a) => a.status === 'running').length;
  const needsYou = Math.max(
    agents.filter((a) => a.status === 'waiting_human').length,
    escalations.length
  );
  const completed = agents.filter((a) => a.status === 'completed').length;
  const primaryCtaIsResolve = needsYou > 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <Suspense fallback={null}>
        <PublicDemoTour userId={userId} />
      </Suspense>

      {needsYou > 0 && (
        <NeedsYouBar count={needsYou} escalation={escalations[0]} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-success" />
            {t('app.liveOverview')}
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
            {t('nav.dashboard')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            {t('app.dashboardBlurb')}
          </p>
        </div>
        {primaryCtaIsResolve ? (
          <Button asChild size="lg" className="bg-urgent hover:bg-urgent/90 text-white">
            <Link
              href={
                escalations[0]
                  ? `/escalations/${escalations[0].id}`
                  : '/escalations'
              }
            >
              <AlertTriangle className="h-4 w-4" />
              {t('app.resolveNeeds')}
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href="/templates">
              <Play className="h-4 w-4" />
              {t('app.launchTemplate')}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('status.running')} value={running} />
        <Stat
          label={t('needsYou.title')}
          value={needsYou}
          tone={needsYou > 0 ? 'urgent' : 'default'}
          href="/escalations"
        />
        <Stat label={t('status.completed')} value={completed} href="/results" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t('common.loading')}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{t('nav.agents')}</h2>
            <p className="text-xs text-muted-foreground">{t('dashboard.dragReorder')}</p>
          </div>
          <SortableAgentGrid agents={agents} reportAgentIds={reportAgentIds} />
        </section>
      )}

      {(escalations.length > 0 || recentArtifacts.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2 pt-2">
          <div className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">{t('needsYou.needsNow')}</h2>
              <Link href="/escalations" className="text-xs text-muted-foreground hover:text-foreground">
                {t('needsYou.all')} →
              </Link>
            </div>
            {escalations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('needsYou.emptyTitle')}</p>
            ) : (
              <ul className="space-y-2">
                {escalations.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/escalations/${e.id}`}
                      className="block rounded-lg border border-urgent/25 bg-urgent/5 px-3 py-2.5 text-sm hover:bg-urgent/10 transition-colors"
                    >
                      <span className="line-clamp-2">
                        {formatEscalationSummary(e.summary, e.context, t)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">{t('results.title')}</h2>
              <Link href="/results" className="text-xs text-muted-foreground hover:text-foreground">
                {t('results.all')} →
              </Link>
            </div>
            {recentArtifacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('results.emptyTitle')}</p>
            ) : (
              <ul className="space-y-2">
                {recentArtifacts.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/results/${a.id}`}
                      className="block rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium line-clamp-1">
                        {formatArtifactTitle(a.title, t, { customMap })}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(a.created_at, locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function NeedsYouBar({
  count,
  escalation,
}: {
  count: number;
  escalation?: Escalation;
}) {
  const t = useT();

  return (
    <Link
      href={escalation ? `/escalations/${escalation.id}` : '/escalations'}
      className="block rounded-xl bg-urgent text-white shadow-sm urgent-ring transition-transform duration-150 hover:scale-[1.01]"
    >
      <div className="min-h-14 px-4 py-3.5 md:px-5 md:py-4 flex items-center gap-3 md:gap-4">
        <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/95">
            {t('app.needsPending', { n: count })}
          </p>
          <p className="text-sm md:text-base font-medium line-clamp-2 mt-0.5">
            {escalation
              ? formatEscalationSummary(escalation.summary, escalation.context, t)
              : t('dashboard.waitingDecision')}
          </p>
        </div>
        <span className="shrink-0 min-h-11 inline-flex items-center text-sm font-bold bg-white text-urgent rounded-md px-4">
          {t('app.decide')}
        </span>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'urgent';
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        'rounded-xl border border-border bg-card/80 px-3 py-3 md:px-4 md:py-4',
        tone === 'urgent' && value > 0 && 'border-urgent/40 bg-urgent/5'
      )}
    >
      <p className="text-[11px] md:text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl md:text-3xl font-semibold tracking-tight',
          tone === 'urgent' && value > 0 && 'text-urgent'
        )}
      >
        {value}
      </p>
    </div>
  );
  return href && value > 0 ? <Link href={href}>{inner}</Link> : inner;
}

function EmptyState() {
  const t = useT();

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <h2 className="font-display text-2xl">{t('app.launchTemplate')}</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">{t('templates.blurb')}</p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/templates">
          <Play className="h-4 w-4" />
          {t('app.launchTemplate')}
        </Link>
      </Button>
    </div>
  );
}
