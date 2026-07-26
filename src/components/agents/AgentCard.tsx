'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes } from 'react';
import { FileText, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStatusBadge } from './AgentStatusBadge';
import type { Agent } from '@/lib/supabase/types';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useLocale, useT } from '@/i18n/locale-context';
import { formatCurrentTask } from '@/i18n/format-activity';
import {
  agentLabel,
  displayNameJaFromConfig,
  roleLabel,
} from '@/lib/templates/ja-overlays';
import { readAgentLabelsJa } from '@/i18n/agent-labels-client';

export function AgentCard({
  agent,
  hasReport = false,
  dragHandleProps,
}: {
  agent: Agent;
  hasReport?: boolean;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [customMap, setCustomMap] = useState<Record<string, string>>({});
  useEffect(() => {
    setCustomMap(readAgentLabelsJa());
  }, []);
  const displayName = agentLabel(agent.name, locale, {
    displayNameJa: displayNameJaFromConfig(agent.config),
    customMap,
  });
  const needsYou = agent.status === 'waiting_human';
  const taskLabel = agent.current_task
    ? formatCurrentTask(agent.current_task, t)
    : t('agent.standingBy');

  return (
    <div className="relative h-full group/card">
      {dragHandleProps && (
        <button
          type="button"
          aria-label={t('agent.reorderAria', {
            name: displayName,
          })}
          className="absolute left-2 top-3 z-10 rounded-md p-1 text-muted-foreground/40 opacity-60 hover:opacity-100 hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing transition-opacity duration-150 group-hover/card:opacity-100 group-hover/card:text-muted-foreground"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <Link href={`/agents/${agent.id}`} className="block group h-full">
        <Card
          className={cn(
            'h-full rounded-xl border border-subtle bg-card transition-all duration-200 hover:-translate-y-0.5',
            dragHandleProps && 'pl-5',
            needsYou && 'urgent-ring border-urgent/40 bg-urgent/[0.08]'
          )}
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold leading-tight truncate">
                {displayName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {roleLabel(agent.role, locale)}
              </p>
            </div>
            <AgentStatusBadge status={agent.status} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {taskLabel}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                {t('agent.updated', { when: formatRelativeTime(agent.updated_at, locale) })}
              </p>
              {hasReport && (
                <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
                  <FileText className="h-3 w-3" />
                  {t('agent.report')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
