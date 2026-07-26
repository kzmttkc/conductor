'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Play, Radio } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useEscalations } from '@/hooks/useEscalations';
import { AgentCard } from '@/components/agents/AgentCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicDemoTour } from '@/components/demo/PublicDemoTour';
import type { Artifact, PlanTier, UsageStats } from '@/lib/supabase/types';
import { UsageMeters } from '@/components/usage/UsageMeters';

export function DashboardView({ userId }: { userId: string }) {
  const { agents, loading } = useAgents(userId);
  const { escalations } = useEscalations(userId);
  const [reportAgentIds, setReportAgentIds] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<PlanTier>('free');
  const [usage, setUsage] = useState<UsageStats | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/artifacts');
      if (!res.ok) return;
      const data = (await res.json()) as Artifact[];
      setReportAgentIds(new Set(data.map((a) => a.agent_id)));
    })();
  }, [agents]);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/plan');
      if (!res.ok) return;
      const data = await res.json();
      setPlan(data.plan);
      setUsage(data.usage);
    })();
  }, [agents.length]);

  const running = agents.filter((a) => a.status === 'running').length;
  const needsYou = agents.filter((a) => a.status === 'waiting_human').length;
  const errors = agents.filter((a) => a.status === 'error').length;
  const completed = agents.filter((a) => a.status === 'completed').length;

  const sorted = [...agents].sort((a, b) => {
    const rank = (s: string) =>
      s === 'waiting_human' ? 0 : s === 'error' ? 1 : s === 'running' ? 2 : 3;
    return rank(a.status) - rank(b.status);
  });

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <PublicDemoTour userId={userId} />
      </Suspense>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-success" />
            Live command view
          </p>
          <h1 className="font-display text-4xl tracking-tight mt-1">Dashboard</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            See who is working, who needs you, and what deserves attention first.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/results">Results</Link>
          </Button>
          <Button asChild>
            <Link href="/templates">
              <Play className="h-4 w-4" />
              Launch template
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Running" value={running} tone="default" />
        <Stat label="Needs You" value={needsYou} tone="urgent" href="/escalations" />
        <Stat label="Errors" value={errors} tone={errors ? 'urgent' : 'default'} />
        <Stat label="Completed" value={completed} tone="default" href="/results" />
      </div>

      {usage && (
        <section className="surface rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Usage this period</h2>
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground">
              Plans →
            </Link>
          </div>
          <UsageMeters plan={plan} usage={usage} agentCount={agents.length} compact />
        </section>
      )}

      {needsYou > 0 && (
        <Link
          href={
            escalations[0]
              ? `/escalations/${escalations[0].id}`
              : '/escalations'
          }
          className="block"
        >
          <Card className="urgent-ring border-urgent/40 bg-urgent text-white transition-transform hover:scale-[1.01]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  {needsYou} agent{needsYou > 1 ? 's' : ''} need your decision
                </p>
                <p className="text-sm text-white/80 truncate">
                  {escalations[0]?.summary ||
                    'Open escalations to resolve and resume the crew.'}
                </p>
              </div>
              <span className="text-sm font-semibold shrink-0 bg-white text-urgent rounded-md px-3 py-1.5">
                Decide now
              </span>
            </CardContent>
          </Card>
        </Link>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Syncing agents…
        </div>
      ) : agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              hasReport={reportAgentIds.has(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number;
  tone: 'default' | 'urgent';
  href?: string;
}) {
  const inner = (
    <Card
      className={
        tone === 'urgent' && value > 0
          ? 'border-urgent/40 bg-urgent/5'
          : 'bg-card/80'
      }
    >
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`mt-1 text-3xl font-semibold tracking-tight ${
            tone === 'urgent' && value > 0 ? 'text-urgent' : ''
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
  return href && value > 0 ? <Link href={href}>{inner}</Link> : inner;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <h2 className="font-display text-2xl">No agents on the floor</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Free: launch Solo Scout or Competitor Watch. Starter+: Market Research Crew.
      </p>
      <Button asChild className="mt-6">
        <Link href="/templates">Launch a crew</Link>
      </Button>
    </div>
  );
}
