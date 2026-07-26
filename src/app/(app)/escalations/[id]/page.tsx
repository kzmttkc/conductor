'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Agent, AgentLog, Escalation } from '@/lib/supabase/types';
import { EscalationDecision } from '@/components/escalation/EscalationDecision';
import { Button } from '@/components/ui/button';

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
      const res = await fetch(`/api/escalations/${params.id}`);
      if (!res.ok) {
        if (!cancelled) setError('Decision not found');
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
    return (
      <div className="max-w-md space-y-4 py-12">
        <p className="text-muted-foreground">
          This decision may have been resolved or no longer exists.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/escalations">View all Needs You</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
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
