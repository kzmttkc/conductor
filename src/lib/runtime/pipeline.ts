import { randomUUID } from 'crypto';
import type { Agent } from '@/lib/supabase/types';
import { rt } from '@/lib/runtime/locale';
import {
  agentLabel,
  displayNameJaFromConfig,
} from '@/lib/templates/ja-overlays';

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
    /stopped|cancel|halted/i.test(agent.current_task || '')
  );
}

/** Prior stage failed or was cancelled — followers must not start. */
function isPriorHalted(agent: Agent) {
  return (
    agent.status === 'error' ||
    isStoppedByCommander(agent) ||
    (agent.status === 'idle' && /Pipeline halted/i.test(agent.current_task || ''))
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
    if (isPriorHalted(prior)) {
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
  const locale =
    agents[0]?.config.locale === 'ja' || agents[0]?.config.locale === 'en'
      ? agents[0].config.locale
      : 'en';
  const lines = agents.map((a, i) => {
    const art = getArtifact(a.id);
    const name = agentLabel(a.name, locale, {
      displayNameJa: displayNameJaFromConfig(a.config),
    });
    const statusKey = `status.${a.status}`;
    const statusLabel = rt(locale, statusKey);
    const status = statusLabel !== statusKey ? statusLabel : a.status;
    return `${i + 1}. **${name}** (${status})${art ? ` — ${art.title}` : ''}`;
  });
  return `# ${rt(locale, 'report.pipelineSummary', { theme })}

**${rt(locale, 'narrative.pipelineId')}:** ${String(agents[0]?.config.pipeline_id ?? 'n/a')}  
**${rt(locale, 'narrative.pipelineCompleted')}:** ${new Date().toISOString()}

## ${rt(locale, 'report.stages')}
${lines.join('\n')}

## ${rt(locale, 'report.notes')}
${rt(locale, 'narrative.pipelineNotes')}
`;
}
