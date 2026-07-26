import { executeAgentPass } from '@/lib/runtime/executor';
import { createAwaitableDbSink } from '@/lib/runtime/db-sink';
import { attachPipelineConfig } from '@/lib/runtime/pipeline';
import * as data from '@/lib/supabase/data';
import type { Agent, PlanTier } from '@/lib/supabase/types';
import { getBundledTemplate } from '@/lib/templates/catalog';

async function loadAgent(agentId: string): Promise<Agent | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: row } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .maybeSingle();
  return (row as Agent | null) ?? null;
}

export async function startProdAgent(agentId: string, humanGuidance?: string | null) {
  const agent = await loadAgent(agentId);
  if (!agent) return null;

  const plan = await data.getPlan(agent.user_id);
  await data.assertUsageBudget(agent.user_id, plan);

  let working = agent;
  const pipelineIds = (agent.config.pipeline_ids as string[]) || [];
  const index = Number(agent.config.pipeline_index ?? 0);
  if (agent.config.pipeline && index > 0 && pipelineIds.length) {
    const arts = await data.listArtifactsForUser(agent.user_id);
    const chunks: string[] = [];
    for (let i = 0; i < index; i++) {
      const art = arts.find((a) => a.agent_id === pipelineIds[i]);
      if (art) chunks.push(`### Upstream: ${art.title}\n\n${art.content_markdown}`);
    }
    working = await data.updateAgent(agentId, {
      config: {
        ...agent.config,
        upstream_reports: chunks.join('\n\n---\n\n'),
      },
    });
  }

  const sink = createAwaitableDbSink(working);
  try {
    await executeAgentPass(working, sink, { humanGuidance });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Runtime failed';
    await data.insertLog(agentId, 'error', message);
    await data.updateAgent(agentId, { status: 'error', current_task: message });
  }
  await sink.flush();

  const fresh = await loadAgent(agentId);
  if (fresh?.status === 'completed') {
    await maybeContinuePipeline(fresh);
  }
  return fresh;
}

async function maybeContinuePipeline(completed: Agent) {
  const nextId = completed.config.pipeline_next as string | null | undefined;
  if (!nextId || !completed.config.pipeline) return;
  await data.updateAgent(nextId, {
    status: 'idle',
    current_task: `Continuing pipeline after ${completed.name}`,
  });
  await startProdAgent(nextId);
}

export async function launchTemplateProd(
  userId: string,
  templateId: string,
  theme: string,
  plan: PlanTier
) {
  const template = getBundledTemplate(templateId);
  if (!template) throw new Error('Template not found');

  await data.assertAgentCapacity(userId, template.agent_definitions.length, plan);
  await data.assertUsageBudget(userId, plan);

  const created: Agent[] = [];
  for (const def of template.agent_definitions) {
    const agent = await data.createAgentRow({
      user_id: userId,
      name: def.name,
      role: def.role,
      current_task: `${def.goal} — Theme: ${theme}`,
      permissions: def.permissions,
      config: {
        goal: def.goal,
        system_prompt: def.system_prompt,
        escalation_conditions: def.escalation_conditions,
        theme,
      },
      template_id: template.id,
      status: 'idle',
    });
    created.push(agent);
  }

  const patches = attachPipelineConfig(created, template.pipeline);
  for (const p of patches) {
    await data.updateAgent(p.id, { config: p.config });
  }

  if (template.pipeline) {
    await startProdAgent(created[0].id);
  } else {
    await Promise.all(created.map((a) => startProdAgent(a.id)));
  }

  const refreshed = await Promise.all(created.map((a) => loadAgent(a.id)));
  return refreshed.filter(Boolean) as Agent[];
}

export async function recoverProdAgent(agentId: string) {
  await data.insertLog(agentId, 'action', 'Commander requested recovery / retry');
  return startProdAgent(agentId, 'Retry after error. Prefer safe sources.');
}

export async function resumeProdAgent(agentId: string, humanResponse: string) {
  const agent = await loadAgent(agentId);
  if (!agent) return null;
  if (/allow web_search|allow browser|allow file_write/i.test(humanResponse)) {
    const permissions = { ...agent.permissions };
    for (const tool of ['web_search', 'browser', 'file_write'] as const) {
      if (new RegExp(`allow ${tool}`, 'i').test(humanResponse)) {
        permissions[tool] = 'allow';
      }
      if (new RegExp(`deny ${tool}`, 'i').test(humanResponse)) {
        permissions[tool] = 'deny';
      }
    }
    await data.updateAgent(agentId, { permissions });
  }
  return startProdAgent(agentId, humanResponse);
}
