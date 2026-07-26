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

export function DashboardView({ userId }: { userId: string }) {
  const { agents, loading } = useAgents(userId);
  const { escalations } = useEscalations(userId);
  const [reportAgentIds, setReportAgentIds] = useState<Set<string>>(new Set());
  const [recentArtifacts, setRecentArtifacts] = useState<Artifact[]>([]);

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
            Command tower
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
            Dashboard
          </h1>
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
              Resolve needs
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href="/templates">
              <Play className="h-4 w-4" />
              Launch template
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Running" value={running} />
        <Stat
          label="Needs You"
          value={needsYou}
          tone={needsYou > 0 ? 'urgent' : 'default'}
          href="/escalations"
        />
        <Stat label="Completed" value={completed} href="/results" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Syncing agents…
        </div>
      ) : agents.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Crew</h2>
            <p className="text-xs text-muted-foreground">Drag to reorder</p>
          </div>
          <SortableAgentGrid agents={agents} reportAgentIds={reportAgentIds} />
        </section>
      )}

      {(escalations.length > 0 || recentArtifacts.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2 pt-2">
          <div className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Recent escalations</h2>
              <Link href="/escalations" className="text-xs text-muted-foreground hover:text-foreground">
                All →
              </Link>
            </div>
            {escalations.length === 0 ? (
              <p className="text-sm text-muted-foreground">None pending.</p>
            ) : (
              <ul className="space-y-2">
                {escalations.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/escalations/${e.id}`}
                      className="block rounded-lg border border-urgent/25 bg-urgent/5 px-3 py-2.5 text-sm hover:bg-urgent/10 transition-colors"
                    >
                      <span className="line-clamp-2">{e.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Recent results</h2>
              <Link href="/results" className="text-xs text-muted-foreground hover:text-foreground">
                All →
              </Link>
            </div>
            {recentArtifacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentArtifacts.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/results/${a.id}`}
                      className="block rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium line-clamp-1">{a.title}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(a.created_at)}
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
  return (
    <Link
      href={escalation ? `/escalations/${escalation.id}` : '/escalations'}
      className="block rounded-xl bg-urgent text-white shadow-sm urgent-ring transition-transform duration-150 hover:scale-[1.01]"
    >
      <div className="px-4 py-3.5 md:px-5 md:py-4 flex items-center gap-3 md:gap-4">
        <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
            Needs You · {count}
          </p>
          <p className="text-sm md:text-base font-medium truncate mt-0.5">
            {escalation?.summary || 'An agent is waiting for your decision.'}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold bg-white text-urgent rounded-md px-3 py-1.5">
          Decide
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
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <h2 className="font-display text-2xl">Launch a template</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Put a crew on the floor. Free: Solo Scout or Content Pipeline.
      </p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/templates">
          <Play className="h-4 w-4" />
          Launch template
        </Link>
      </Button>
    </div>
  );
}
