import { Badge } from '@/components/ui/badge';
import type { AgentStatus } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<AgentStatus, { label: string; className: string }> = {
  idle: {
    label: 'Idle',
    className: 'bg-muted text-muted-foreground border-transparent',
  },
  running: {
    label: 'Running',
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-transparent',
  },
  waiting_human: {
    label: 'Needs you',
    className: 'bg-urgent/15 text-urgent border-transparent animate-pulse',
  },
  error: {
    label: 'Error',
    className: 'bg-urgent text-white border-transparent',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success/15 text-success border-transparent',
  },
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = statusConfig[status];
  return (
    <Badge className={cn('font-medium', config.className)}>{config.label}</Badge>
  );
}
