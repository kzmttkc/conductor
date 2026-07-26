import { Badge } from '@/components/ui/badge';
import type { AgentStatus } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  AgentStatus,
  { label: string; className: string }
> = {
  idle: { label: 'Idle', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  running: { label: 'Running', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  waiting_human: {
    label: 'Needs You',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse',
  },
  error: { label: 'Error', className: 'bg-red-600 text-white' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const config = statusConfig[status];
  return (
    <Badge className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
