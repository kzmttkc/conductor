import { executeAgentPass } from '@/lib/runtime/executor';
import { createAwaitableDbSink } from '@/lib/runtime/db-sink';
import { RuntimeError } from '@/lib/runtime/errors';
import {
  releaseAgentLock,
  tryAcquireAgentLock,
} from '@/lib/runtime/locks';
import { slog } from '@/lib/runtime/observability';
import {
  attachPipelineConfig,
  buildPipelineSummaryMarkdown,
  canStartPipelineStage,
  collectUpstreamMarkdown,
} from '@/lib/runtime/pipeline';
import * as data from '@/lib/supabase/data';
import type { Agent, PlanTier } from '@/lib/supabase/types';
import { getBundledTemplate } from '@/lib/templates/catalog';
import { agentLabel, localizeAgentDefinition } from '@/lib/templates/ja-overlays';
import { rt } from '@/lib/runtime/locale';

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

export async function startProdAgent(
  agentId: string,
  humanGuidance?: string | null,
  locale?: 'en' | 'ja'
) {
  let agent = await loadAgent(agentId);
  if (!agent) return null;

  if (locale) {
    agent = await data.updateAgent(agentId, {
      config: { ...agent.config, locale },
    });
  }

  if (agent.status === 'running' || !tryAcquireAgentLock(agentId)) {
    throw new RuntimeError('conflict', 'Agent is already running');
  }

  try {
    const plan = await data.getPlan(agent.user_id);
    await data.assertUsageBudget(agent.user_id, plan);

    let working = agent;
    const pipelineIds = (agent.config.pipeline_ids as string[]) || [];
    const index = Number(agent.config.pipeline_index ?? 0);

    if (agent.config.pipeline && index > 0 && pipelineIds.length) {
      const arts = await data.listArtifactsForUser(agent.user_id);
      const getArtifact = (id: string) => arts.find((a) => a.agent_id === id) ?? null;
      const agentsCache = new Map<string, Agent | null>();
      const getAgent = async (id: string) => {
        if (agentsCache.has(id)) return agentsCache.get(id)!;
        const row = await loadAgent(id);
        agentsCache.set(id, row);
        return row;
      };
      // Sync gate using freshly loaded priors
      const priors: Agent[] = [];
      for (const id of pipelineIds.slice(0, index)) {
        const p = await getAgent(id);
        if (p) priors.push(p);
      }
      const gate = canStartPipelineStage({
        index,
        pipelineIds,
        getAgent: (id) => priors.find((p) => p.id === id) ?? null,
        getArtifact,
      });
      if (!gate.ok) {
        if (gate.reason === 'blocked') {
          await data.updateAgent(agentId, {
            status: 'idle',
            current_task: `Pipeline halted: ${gate.detail}`,
          });
          await data.insertLog(agentId, 'error', gate.detail, {
            code: 'cancelled',
            type: 'handoff',
          });
          return await loadAgent(agentId);
        }
        throw new RuntimeError('conflict', gate.detail);
      }
      const upstream = collectUpstreamMarkdown(getArtifact, pipelineIds, index);
      working = await data.updateAgent(agentId, {
        config: {
          ...agent.config,
          upstream_reports: upstream,
        },
      });
      slog('pipeline.handoff', {
        to: agentId,
        ok: true,
        upstreamChars: upstream.length,
        pipelineId: agent.config.pipeline_id,
      });
    }

    const sink = createAwaitableDbSink(working);
    try {
      const passLocale =
        locale ??
        (working.config.locale === 'ja' || working.config.locale === 'en'
          ? working.config.locale
          : undefined);
      await executeAgentPass(working, sink, { humanGuidance, locale: passLocale });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Runtime failed';
      await data.insertLog(agentId, 'error', message);
      await data.updateAgent(agentId, { status: 'error', current_task: message });
      slog('agent.error', { agentId, message });
    }
    await sink.flush();

    const fresh = await loadAgent(agentId);
    if (fresh?.status === 'completed') {
      await maybeContinuePipeline(fresh);
    }
    return fresh;
  } finally {
    releaseAgentLock(agentId);
  }
}

async function maybeContinuePipeline(completed: Agent) {
  const pipelineIds = (completed.config.pipeline_ids as string[]) || [];
  const nextId = completed.config.pipeline_next as string | null | undefined;

  if (!completed.config.pipeline) return;

  if (!nextId) {
    if (pipelineIds.length > 1) {
      const arts = await data.listArtifactsForUser(completed.user_id);
      const crew = (
        await Promise.all(pipelineIds.map((id) => loadAgent(id)))
      ).filter(Boolean) as Agent[];
      const markdown = buildPipelineSummaryMarkdown(
        crew,
        (id) => arts.find((a) => a.agent_id === id) ?? null
      );
      await data.insertArtifact({
        agent_id: completed.id,
        user_id: completed.user_id,
        title: `Pipeline summary: ${String(completed.config.theme ?? completed.name)}`,
        content_markdown: markdown,
      });
      await data.insertLog(completed.id, 'result', 'Pipeline summary artifact saved', {
        type: 'handoff',
        pipeline_id: completed.config.pipeline_id,
        i18nKey: 'log.pipelineSummarySaved',
      });
    }
    return;
  }

  const next = await loadAgent(nextId);
  if (!next) return;

  const arts = await data.listArtifactsForUser(completed.user_id);
  const index = Number(next.config.pipeline_index ?? 0);
  const priors = (
    await Promise.all(pipelineIds.slice(0, index).map((id) => loadAgent(id)))
  ).filter(Boolean) as Agent[];

  const gate = canStartPipelineStage({
    index,
    pipelineIds,
    getAgent: (id) => priors.find((p) => p.id === id) ?? null,
    getArtifact: (id) => arts.find((a) => a.agent_id === id) ?? null,
  });

  if (!gate.ok) {
    await data.insertLog(nextId, 'action', `Pipeline gated: ${gate.detail}`, {
      type: 'handoff',
      reason: gate.reason,
      pipeline_id: completed.config.pipeline_id,
      i18nKey: 'log.pipelineGated',
      i18nParams: { detail: gate.detail },
    });
    slog('pipeline.handoff', {
      from: completed.id,
      to: nextId,
      ok: false,
      reason: gate.reason,
      detail: gate.detail,
    });
    if (gate.reason === 'blocked') {
      await data.updateAgent(nextId, {
        status: 'idle',
        current_task: `Pipeline halted: ${gate.detail}`,
      });
    }
    return;
  }

  const upstream = collectUpstreamMarkdown(
    (id) => arts.find((a) => a.agent_id === id) ?? null,
    pipelineIds,
    index
  );
  const nextLocale =
    completed.config.locale === 'ja' || completed.config.locale === 'en'
      ? completed.config.locale
      : 'en';
  const displayName = agentLabel(completed.name, nextLocale, {
    displayNameJa:
      typeof completed.config.display_name_ja === 'string'
        ? completed.config.display_name_ja
        : null,
  });
  await data.updateAgent(nextId, {
    status: 'idle',
    current_task: `Continuing pipeline after ${completed.name}`,
    config: {
      ...next.config,
      upstream_reports: upstream,
      locale: nextLocale,
    },
  });
  await data.insertLog(nextId, 'action', `Handoff from ${completed.name}`, {
    type: 'handoff',
    from: completed.id,
    pipeline_id: completed.config.pipeline_id,
    i18nKey: 'log.handoffFrom',
    i18nParams: { name: displayName },
  });
  slog('pipeline.handoff', {
    from: completed.id,
    to: nextId,
    ok: true,
    upstreamChars: upstream.length,
    pipelineId: completed.config.pipeline_id,
  });
  await startProdAgent(nextId, null, nextLocale);
}

export async function launchTemplateProd(
  userId: string,
  templateId: string,
  theme: string,
  plan: PlanTier,
  locale: 'en' | 'ja' = 'en',
  preferJaSources = false,
  preferStructuredJa = false
) {
  const template = getBundledTemplate(templateId);
  if (!template) throw new Error('Template not found');

  await data.assertAgentCapacity(userId, template.agent_definitions.length, plan);
  await data.assertUsageBudget(userId, plan);

  const created: Agent[] = [];
  for (const raw of template.agent_definitions) {
    const def = localizeAgentDefinition(raw, locale);
    const agent = await data.createAgentRow({
      user_id: userId,
      name: def.name,
      role: def.role,
      current_task: rt(locale, 'log.goalTheme', { goal: def.goal, theme }),
      permissions: def.permissions,
      config: {
        goal: def.goal,
        system_prompt: def.system_prompt,
        escalation_conditions: def.escalation_conditions,
        theme,
        locale,
        prefer_ja_sources: preferJaSources,
        prefer_structured_ja: preferStructuredJa,
      },
      template_id: template.id,
      status: 'idle',
    });
    created.push(agent);
  }

  const patches = attachPipelineConfig(created, template.pipeline);
  for (const p of patches) {
    await data.updateAgent(p.id, { config: { ...p.config, locale } });
  }

  if (template.pipeline) {
    await startProdAgent(created[0].id, null, locale);
  } else {
    await Promise.all(created.map((a) => startProdAgent(a.id, null, locale)));
  }

  const refreshed = await Promise.all(created.map((a) => loadAgent(a.id)));
  return refreshed.filter(Boolean) as Agent[];
}

export async function recoverProdAgent(agentId: string, locale?: 'en' | 'ja') {
  await data.insertLog(agentId, 'action', 'Recovery / retry requested', {
    i18nKey: 'log.recoveryRequested',
  });
  const agent = await loadAgent(agentId);
  const loc =
    locale ??
    (agent?.config.locale === 'ja' || agent?.config.locale === 'en'
      ? agent.config.locale
      : 'en');
  const { rt } = await import('@/lib/runtime/locale');
  return startProdAgent(agentId, rt(loc, 'llm.recoverGuidance'), loc);
}

export async function resumeProdAgent(
  agentId: string,
  humanResponse: string,
  locale?: 'en' | 'ja'
) {
  const agent = await loadAgent(agentId);
  if (!agent) return null;
  if (
    /allow\s+web_search|web_search\s*を許可|この実行で\s*web_search/i.test(
      humanResponse
    ) ||
    /allow\s+browser|browser\s*を許可|この実行で\s*browser/i.test(humanResponse) ||
    /allow\s+file_write|file_write\s*を許可|この実行で\s*file_write/i.test(
      humanResponse
    )
  ) {
    const permissions = { ...agent.permissions };
    for (const tool of ['web_search', 'browser', 'file_write'] as const) {
      if (
        new RegExp(`allow\\s+${tool}`, 'i').test(humanResponse) ||
        new RegExp(`${tool}\\s*を許可`, 'i').test(humanResponse) ||
        new RegExp(`この実行で\\s*${tool}`, 'i').test(humanResponse)
      ) {
        permissions[tool] = 'allow';
      }
      if (
        new RegExp(`deny\\s+${tool}`, 'i').test(humanResponse) ||
        new RegExp(`${tool}\\s*を拒否`, 'i').test(humanResponse)
      ) {
        permissions[tool] = 'deny';
      }
    }
    await data.updateAgent(agentId, { permissions });
  }
  slog('agent.resume', { agentId });
  return startProdAgent(agentId, humanResponse, locale);
}
