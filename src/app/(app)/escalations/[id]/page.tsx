'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Agent, AgentLog, Escalation } from '@/lib/supabase/types';
import { EscalationDecision } from '@/components/escalation/EscalationDecision';

export default function EscalationDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{
    escalation: Escalation;
    agent: Agent;
    logs: AgentLog[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/demo/escalations/${params.id}`);
      if (!res.ok) {
        if (!cancelled) setError('Escalation not found');
        return;
      }
      const json = await res.json();
      if (!cancelled) setData(json);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (error) {
    return <p className="text-muted-foreground">{error}</p>;
  }

  if (!data) {
    return (
      <div className="flex items-center text-muted-foreground py-20">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading decision…
      </div>
    );
  }

  return (
    <EscalationDecision
      escalation={data.escalation}
      agent={data.agent}
      logs={data.logs}
    />
  );
}
