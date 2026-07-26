import type { Agent } from '@/lib/supabase/types';

export type PipelineConfig = {
  pipeline: boolean;
  pipeline_index: number;
  pipeline_ids: string[];
  pipeline_next: string | null;
  upstream_reports?: string;
};

export function attachPipelineConfig(
  agents: Agent[],
  pipeline: boolean
): { id: string; config: Record<string, unknown> }[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    config: {
      ...agent.config,
      pipeline,
      pipeline_index: index,
      pipeline_ids: agents.map((a) => a.id),
      pipeline_next: pipeline ? agents[index + 1]?.id ?? null : null,
    },
  }));
}

export function collectUpstreamMarkdown(
  getArtifact: (agentId: string) => { content_markdown: string; title: string } | null,
  pipelineIds: string[],
  upToExclusiveIndex: number
) {
  const chunks: string[] = [];
  for (let i = 0; i < upToExclusiveIndex; i++) {
    const id = pipelineIds[i];
    const art = getArtifact(id);
    if (art) {
      chunks.push(`### Upstream: ${art.title}\n\n${art.content_markdown}`);
    }
  }
  return chunks.join('\n\n---\n\n');
}
