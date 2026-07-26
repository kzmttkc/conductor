import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStatusBadge } from './AgentStatusBadge';
import type { Agent } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function AgentCard({ agent }: { agent: Agent }) {
  const isUrgent = agent.status === 'waiting_human' || agent.status === 'error';

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card
        className={cn(
          'hover:shadow-md transition-all cursor-pointer border',
          isUrgent && 'border-red-300 dark:border-red-700 shadow-red-100/50'
        )}
      >
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-base font-semibold leading-tight">
            {agent.name}
          </CardTitle>
          <AgentStatusBadge status={agent.status} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {agent.current_task || agent.role}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(agent.updated_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
