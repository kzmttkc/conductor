import { randomUUID } from 'crypto';
import type { Agent } from '@/lib/supabase/types';

export type PipelineConfig = {
  pipeline: boolean;
  pipeline_id: string;
  pipeline_index: number;
  pipeline_ids: string[];
  pipeline_next: string | null;
  upstream_reports?: string;
};

export function attachPipelineConfig(
  agents: Agent[],
  pipeline: boolean,
  pipelineId = randomUUID()
): { id: string; config: Record<string, unknown> }[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    config: {
      ...agent.config,
      pipeline,
      pipeline_id: pipeline ? pipelineId : null,
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
      chunks.push(`### Upstream report: ${art.title}\n\n${art.content_markdown}`);
    }
  }
  return chunks.join('\n\n---\n\n');
}

function isStoppedByCommander(agent: Agent) {
  return (
    agent.status === 'idle' &&
    /stopped|cancel/i.test(agent.current_task || '')
  );
}

/** Gate: followers may start only if every prior agent is completed with an artifact. */
export function canStartPipelineStage(opts: {
  index: number;
  pipelineIds: string[];
  getAgent: (id: string) => Agent | null;
  getArtifact: (id: string) => { content_markdown: string; title: string } | null;
}): { ok: true } | { ok: false; reason: 'waiting' | 'blocked'; detail: string } {
  const { index, pipelineIds, getAgent, getArtifact } = opts;
  if (index <= 0) return { ok: true };

  for (let i = 0; i < index; i++) {
    const id = pipelineIds[i];
    const prior = getAgent(id);
    if (!prior) {
      return { ok: false, reason: 'blocked', detail: `Missing prior agent ${id}` };
    }
    if (prior.status === 'error' || isStoppedByCommander(prior)) {
      return {
        ok: false,
        reason: 'blocked',
        detail: `Prior agent ${prior.name} halted (${prior.status}); pipeline stopped.`,
      };
    }
    if (prior.status !== 'completed') {
      return {
        ok: false,
        reason: 'waiting',
        detail: `Waiting for ${prior.name} to complete.`,
      };
    }
    if (!getArtifact(id)) {
      return {
        ok: false,
        reason: 'waiting',
        detail: `Waiting for artifact from ${prior.name}.`,
      };
    }
  }
  return { ok: true };
}

export function buildPipelineSummaryMarkdown(
  agents: Agent[],
  getArtifact: (agentId: string) => { content_markdown: string; title: string } | null
) {
  const theme = String(agents[0]?.config.theme ?? 'Mission');
  const lines = agents.map((a, i) => {
    const art = getArtifact(a.id);
    return `${i + 1}. **${a.name}** (${a.status})${art ? ` — ${art.title}` : ''}`;
  });
  return `# Pipeline summary — ${theme}

**Pipeline id:** ${String(agents[0]?.config.pipeline_id ?? 'n/a')}  
**Completed:** ${new Date().toISOString()}

## Stages
${lines.join('\n')}

## Notes
All stage reports are available as individual artifacts. This summary marks the crew run as finished.
`;
}
