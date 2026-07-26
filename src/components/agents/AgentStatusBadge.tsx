'use client';

import { Badge } from '@/components/ui/badge';
import type { AgentStatus } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/locale-context';

const statusClassName: Record<AgentStatus, string> = {
  idle: 'bg-muted text-muted-foreground border-transparent',
  running: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-transparent',
  waiting_human: 'bg-urgent/15 text-urgent border-transparent animate-pulse',
  error: 'bg-urgent text-white border-transparent',
  completed: 'bg-success/15 text-success border-transparent',
};

const statusKeys: Record<AgentStatus, string> = {
  idle: 'status.idle',
  running: 'status.running',
  waiting_human: 'status.waiting_human',
  error: 'status.error',
  completed: 'status.completed',
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const t = useT();

  return (
    <Badge className={cn('font-medium', statusClassName[status])}>
      {t(statusKeys[status])}
    </Badge>
  );
}
