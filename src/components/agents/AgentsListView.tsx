'use client';

import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { AgentCard } from '@/components/agents/AgentCard';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/locale-context';

export function AgentsListView({ userId }: { userId: string }) {
  const { agents, loading } = useAgents(userId);
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{t('agents.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('agents.subtitle')}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/agents/new">
            <Plus className="h-4 w-4" />
            {t('agents.newAgent')}
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center text-muted-foreground py-16">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('common.loading')}
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">{t('agents.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('agents.emptyBody')}</p>
          <Button asChild className="mt-5">
            <Link href="/templates">{t('agents.launch')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
