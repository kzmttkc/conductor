'use client';

import { useParams } from 'next/navigation';
import { AgentDetailView } from '@/components/agents/AgentDetailView';

export default function AgentPage() {
  const params = useParams<{ id: string }>();
  return <AgentDetailView agentId={params.id} />;
}
