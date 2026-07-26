import type { Escalation } from '@/lib/supabase/types';

function normalizeSummary(summary: string) {
  return summary.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Keep latest pending escalation per agent; drop consecutive identical summaries. */
export function dedupePendingEscalations(items: Escalation[]): Escalation[] {
  const pending = items.filter((e) => e.status === 'pending');
  const sorted = [...pending].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
  );

  const byAgent = new Map<string, Escalation>();
  for (const e of sorted) {
    if (!byAgent.has(e.agent_id)) byAgent.set(e.agent_id, e);
  }

  const primary = [...byAgent.values()].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
  );

  const out: Escalation[] = [];
  for (const e of primary) {
    const prev = out[out.length - 1];
    if (prev && normalizeSummary(prev.summary) === normalizeSummary(e.summary)) {
      continue;
    }
    out.push(e);
  }
  return out;
}
