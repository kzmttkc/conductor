import Link from 'next/link';
import type { ButtonHTMLAttributes } from 'react';
import { FileText, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStatusBadge } from './AgentStatusBadge';
import type { Agent } from '@/lib/supabase/types';
import { cn, formatRelativeTime } from '@/lib/utils';

export function AgentCard({
  agent,
  hasReport = false,
  dragHandleProps,
}: {
  agent: Agent;
  hasReport?: boolean;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const isUrgent = agent.status === 'waiting_human' || agent.status === 'error';
  const needsYou = agent.status === 'waiting_human';

  return (
    <div className="relative h-full">
      {dragHandleProps && (
        <button
          type="button"
          aria-label={`Reorder ${agent.name}`}
          className="absolute left-2 top-3 z-10 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <Link href={`/agents/${agent.id}`} className="block group h-full">
        <Card
          className={cn(
            'h-full rounded-xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
            dragHandleProps && 'pl-5',
            isUrgent && 'urgent-ring border-urgent/40',
            needsYou && 'bg-urgent/[0.05] ring-1 ring-urgent/30'
          )}
        >
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold leading-tight truncate">
                {agent.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{agent.role}</p>
            </div>
            <AgentStatusBadge status={agent.status} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {agent.current_task || 'Standing by for orders'}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                Updated {formatRelativeTime(agent.updated_at)}
              </p>
              {hasReport && (
                <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
                  <FileText className="h-3 w-3" />
                  Report
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
