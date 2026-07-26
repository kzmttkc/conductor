'use client';

import { PLAN_LIMITS, type PlanTier, type UsageStats } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function UsageMeters({
  plan,
  usage,
  agentCount,
  compact = false,
}: {
  plan: PlanTier;
  usage: UsageStats;
  agentCount: number;
  compact?: boolean;
}) {
  const limits = PLAN_LIMITS[plan];
  const rows = [
    { label: 'Agents', value: agentCount, max: limits.maxAgents },
    { label: 'Agent runs', value: usage.agentRuns, max: limits.maxAgentRuns },
    {
      label: 'AI usage (approx)',
      value: usage.tokensApprox,
      max: limits.maxTokensApprox,
    },
    { label: 'Needs You calls', value: usage.escalations, max: null as number | null },
  ];
  const softHit =
    usage.agentRuns >= limits.maxAgentRuns ||
    usage.tokensApprox >= limits.maxTokensApprox;

  return (
    <div className="space-y-3">
      {softHit && (
        <p className="text-xs text-warning rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
          You&apos;re at or past this period&apos;s soft limit. New runs may be blocked near
          120% — consider upgrading in Settings.
        </p>
      )}
    <div className={cn('grid gap-3', compact ? 'grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2')}>
      {rows.map((row) => {
        const pct =
          row.max && row.max > 0 ? Math.min(100, Math.round((row.value / row.max) * 100)) : null;
        const hot = pct !== null && pct >= 85;
        return (
          <div key={row.label} className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">{row.label}</p>
              <p className={cn('text-sm font-semibold', hot && 'text-urgent')}>
                {row.value}
                {row.max !== null ? (
                  <span className="text-muted-foreground font-normal"> / {row.max}</span>
                ) : null}
              </p>
            </div>
            {pct !== null && (
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', hot ? 'bg-urgent' : 'bg-foreground/70')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
}
