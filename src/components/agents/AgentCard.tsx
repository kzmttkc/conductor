import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStatusBadge } from './AgentStatusBadge';
import type { Agent } from '@/lib/supabase/types';
import { cn, formatRelativeTime } from '@/lib/utils';

export function AgentCard({
  agent,
  hasReport = false,
}: {
  agent: Agent;
  hasReport?: boolean;
}) {
  const isUrgent = agent.status === 'waiting_human' || agent.status === 'error';

  return (
    <Link href={`/agents/${agent.id}`} className="block group">
      <Card
        className={cn(
          'h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border bg-card/90',
          isUrgent && 'urgent-ring border-urgent/40',
          agent.status === 'waiting_human' && 'bg-urgent/[0.04]'
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
  );
}
