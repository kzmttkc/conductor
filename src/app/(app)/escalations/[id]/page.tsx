'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Agent, AgentLog, Escalation } from '@/lib/supabase/types';
import { EscalationDecision } from '@/components/escalation/EscalationDecision';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/locale-context';

export default function EscalationDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useT();
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
        if (!cancelled) setError(t('decision.notFound'));
        return;
      }
      const json = await res.json();
      if (!cancelled) setData(json);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, t]);

  if (error) {
    return (
      <div className="max-w-md space-y-4 py-12">
        <p className="text-muted-foreground">{t('decision.notFoundBody')}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/escalations">{t('decision.viewAll')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{t('decision.backDash')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center text-muted-foreground py-20">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t('decision.loading')}
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
