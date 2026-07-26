import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import type {
  Agent,
  AgentLog,
  Artifact,
  Escalation,
  PermissionLevel,
  PlanTier,
  Template,
  ToolName,
  UsageStats,
} from '@/lib/supabase/types';
import { normalizePermission, PLAN_LIMITS } from '@/lib/supabase/types';
import { executeAgentPass } from '@/lib/runtime/executor';
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
import { sanitizeMarkdown, clipText, clipSummary } from '@/lib/security/validate';
import { getBundledTemplate, listBundledTemplates } from '@/lib/templates/catalog';
import { agentLabel, localizeAgentDefinition } from '@/lib/templates/ja-overlays';
import { rt } from '@/lib/runtime/locale';

/** @deprecated Prefer visitorFromSession — kept for scripts/fixtures */
export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'commander@conductor.local',
  name: 'You',
};

type StoreEvent =
  | { type: 'agents'; payload: Agent | { id: string }; event: 'INSERT' | 'UPDATE' | 'DELETE' }
  | { type: 'escalations'; payload: Escalation; event: 'INSERT' | 'UPDATE' }
  | { type: 'agent_logs'; payload: AgentLog; event: 'INSERT' }
  | { type: 'artifacts'; payload: Artifact; event: 'INSERT' };

export class DemoStore extends EventEmitter {
  agents: Agent[] = [];
  logs: AgentLog[] = [];
  escalations: Escalation[] = [];
  artifacts: Artifact[] = [];
  templates: Template[] = [];
  /** Per-visitor plan (defaults to free) */
  plans = new Map<string, PlanTier>();
  /** Per-visitor onboarding completion */
  onboardedUsers = new Set<string>();
  usage: UsageStats = {
    agentRuns: 0,
    toolCalls: 0,
    escalations: 0,
    tokensApprox: 0,
    periodStart: new Date().toISOString(),
  };
  private runtimeAbort = new Set<string>();
  private running = new Set<string>();

  constructor() {
    super();
    this.setMaxListeners(100);
    this.seedTemplates();
  }

  private seedTemplates() {
    this.templates = listBundledTemplates();
  }

  private now() {
    return new Date().toISOString();
  }

  private emitChange(event: StoreEvent) {
    this.emit('change', event);
  }

  listAgents(userId: string) {
    return this.agents
      .filter((a) => a.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getAgent(id: string) {
    return this.agents.find((a) => a.id === id) ?? null;
  }

  updateAgent(id: string, patch: Partial<Agent>) {
    const idx = this.agents.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const updated: Agent = {
      ...this.agents[idx],
      ...patch,
      updated_at: this.now(),
    };
    this.agents[idx] = updated;
    this.emitChange({ type: 'agents', payload: updated, event: 'UPDATE' });
    return updated;
  }

  createAgent(input: {
    user_id: string;
    name: string;
    role: string;
    current_task?: string | null;
    permissions?: Record<string, unknown>;
    config?: Record<string, unknown>;
    template_id?: string | null;
    status?: Agent['status'];
  }) {
    const permissions: Agent['permissions'] = {};
    for (const [k, v] of Object.entries(input.permissions ?? {})) {
      permissions[k as ToolName] = normalizePermission(v);
    }

    const agent: Agent = {
      id: randomUUID(),
      user_id: input.user_id,
      name: input.name,
      role: input.role,
      status: input.status ?? 'idle',
      current_task: input.current_task ?? null,
      permissions,
      config: input.config ?? {},
      template_id: input.template_id ?? null,
      created_at: this.now(),
      updated_at: this.now(),
    };
    this.agents.unshift(agent);
    this.emitChange({ type: 'agents', payload: agent, event: 'INSERT' });
    return agent;
  }

  deleteAgent(id: string) {
    const existing = this.getAgent(id);
    if (!existing) return false;
    this.runtimeAbort.add(id);
    this.agents = this.agents.filter((a) => a.id !== id);
    this.logs = this.logs.filter((l) => l.agent_id !== id);
    this.escalations = this.escalations.filter((e) => e.agent_id !== id);
    this.artifacts = this.artifacts.filter((a) => a.agent_id !== id);
    this.emitChange({ type: 'agents', payload: { id }, event: 'DELETE' });
    return true;
  }

  addLog(
    agentId: string,
    type: AgentLog['type'],
    content: string,
    metadata: Record<string, unknown> = {}
  ) {
    const log: AgentLog = {
      id: randomUUID(),
      agent_id: agentId,
      type,
      content,
      metadata,
      created_at: this.now(),
    };
    this.logs.push(log);
    this.emitChange({ type: 'agent_logs', payload: log, event: 'INSERT' });
    return log;
  }

  listLogs(agentId: string) {
    return this.logs
      .filter((l) => l.agent_id === agentId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  saveArtifact(input: {
    agent_id: string;
    user_id: string;
    title: string;
    content_markdown: string;
    kind?: Artifact['kind'];
  }) {
    const artifact: Artifact = {
      id: randomUUID(),
      agent_id: input.agent_id,
      user_id: input.user_id,
      title: clipText(input.title, 200),
      kind: input.kind ?? 'report',
      content_markdown: sanitizeMarkdown(input.content_markdown),
      created_at: this.now(),
    };
    this.artifacts.unshift(artifact);
    this.updateAgent(input.agent_id, {
      config: {
        ...this.getAgent(input.agent_id)?.config,
        latest_artifact_id: artifact.id,
      },
    });
    this.emitChange({ type: 'artifacts', payload: artifact, event: 'INSERT' });
    return artifact;
  }

  listArtifacts(userId: string) {
    return this.artifacts
      .filter((a) => a.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getArtifact(id: string) {
    return this.artifacts.find((a) => a.id === id) ?? null;
  }

  getLatestArtifactForAgent(agentId: string) {
    return this.artifacts.find((a) => a.agent_id === agentId) ?? null;
  }

  createEscalation(input: {
    agent_id: string;
    summary: string;
    context?: Record<string, unknown>;
    options?: string[];
  }) {
    const summary = clipSummary(input.summary);
    const options = (input.options ?? []).map((o) => clipText(o, 500)).slice(0, 6);
    const escalation: Escalation = {
      id: randomUUID(),
      agent_id: input.agent_id,
      status: 'pending',
      summary,
      context: input.context ?? {},
      options,
      human_response: null,
      resolved_at: null,
      created_at: this.now(),
    };
    this.escalations.unshift(escalation);
    this.usage.escalations += 1;
    this.updateAgent(input.agent_id, {
      status: 'waiting_human',
      current_task: `Awaiting decision: ${summary}`,
    });
    this.addLog(input.agent_id, 'escalation', summary, {
      escalation_id: escalation.id,
    });
    this.emitChange({ type: 'escalations', payload: escalation, event: 'INSERT' });
    return escalation;
  }

  getEscalation(id: string) {
    return this.escalations.find((e) => e.id === id) ?? null;
  }

  listEscalations(userId: string, status?: Escalation['status']) {
    const agentIds = new Set(this.listAgents(userId).map((a) => a.id));
    return this.escalations
      .filter((e) => agentIds.has(e.agent_id))
      .filter((e) => (status ? e.status === status : true))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  resolveEscalation(
    id: string,
    action: 'approve' | 'revise' | 'cancel',
    humanResponse: string
  ) {
    const escalation = this.getEscalation(id);
    if (!escalation || escalation.status !== 'pending') return null;

    const status = action === 'cancel' ? 'cancelled' : 'resolved';
    const updated: Escalation = {
      ...escalation,
      status,
      human_response: humanResponse,
      resolved_at: this.now(),
    };
    this.escalations = this.escalations.map((e) => (e.id === id ? updated : e));
    this.emitChange({ type: 'escalations', payload: updated, event: 'UPDATE' });

    if (action === 'cancel') {
      this.updateAgent(escalation.agent_id, {
        status: 'idle',
        current_task: 'Stopped by user',
      });
      this.addLog(escalation.agent_id, 'action', `Cancelled by human: ${humanResponse}`, {
        i18nKey: 'log.cancelledByHuman',
        i18nParams: { response: humanResponse },
      });
    } else {
      // Permission grants from approval language
      if (
        /allow\s+web_search|web_search\s*を許可|この実行で\s*web_search/i.test(
          humanResponse
        ) ||
        /allow\s+browser|browser\s*を許可|この実行で\s*browser/i.test(humanResponse) ||
        /allow\s+file_write|file_write\s*を許可|この実行で\s*file_write/i.test(
          humanResponse
        )
      ) {
        const agent = this.getAgent(escalation.agent_id);
        if (agent) {
          const permissions = { ...agent.permissions };
          for (const tool of ['web_search', 'browser', 'file_write'] as ToolName[]) {
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
          this.updateAgent(escalation.agent_id, { permissions });
        }
      }

      this.addLog(
        escalation.agent_id,
        'action',
        `Human ${action === 'approve' ? 'approved' : 'revised'}: ${humanResponse}`,
        {
          i18nKey: action === 'approve' ? 'log.humanApproved' : 'log.humanRevised',
          i18nParams: { response: humanResponse },
        }
      );
      // Caller should await resumeAgent (serverless-safe).
    }

    return updated;
  }

  /** Clears one visitor's floor (safe for shared public demo). */
  resetUser(userId: string) {
    const ids = this.listAgents(userId).map((a) => a.id);
    for (const id of ids) {
      this.deleteAgent(id);
    }
    this.onboardedUsers.delete(userId);
    this.emit('reset');
  }

  /** @deprecated Prefer resetUser — wipes entire process store */
  reset() {
    this.runtimeAbort = new Set(this.agents.map((a) => a.id));
    this.running.clear();
    this.agents = [];
    this.logs = [];
    this.escalations = [];
    this.artifacts = [];
    this.plans.clear();
    this.onboardedUsers.clear();
    this.usage = {
      agentRuns: 0,
      toolCalls: 0,
      escalations: 0,
      tokensApprox: 0,
      periodStart: this.now(),
    };
    this.emit('reset');
  }

  getPlan(userId: string): PlanTier {
    return this.plans.get(userId) ?? 'free';
  }

  setPlan(userId: string, plan: PlanTier) {
    this.plans.set(userId, plan);
  }

  listTemplates() {
    return this.templates;
  }

  getTemplate(id: string) {
    return this.templates.find((t) => t.id === id) ?? null;
  }

  launchTemplate(
    userId: string,
    templateId: string,
    theme: string,
    locale: 'en' | 'ja' = 'en',
    preferJaSources = false,
    preferStructuredJa = false
  ) {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    return template.agent_definitions.map((raw) => {
      const def = localizeAgentDefinition(raw, locale);
      return this.createAgent({
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
    });
  }

  async launchTemplateAndRun(
    userId: string,
    templateId: string,
    theme: string,
    locale: 'en' | 'ja' = 'en',
    preferJaSources = false,
    preferStructuredJa = false
  ) {
    const created = this.launchTemplate(
      userId,
      templateId,
      theme,
      locale,
      preferJaSources,
      preferStructuredJa
    );
    const meta = getBundledTemplate(templateId);
    const pipeline = Boolean(meta?.pipeline && created.length > 1);
    for (const patch of attachPipelineConfig(created, pipeline)) {
      this.updateAgent(patch.id, { config: { ...patch.config, locale } });
    }
    if (pipeline) {
      await this.startRuntime(created[0].id, null, locale);
    } else {
      await Promise.all(created.map((agent) => this.startRuntime(agent.id, null, locale)));
    }
    return created.map((a) => this.getAgent(a.id)!);
  }

  private async continuePipeline(completedId: string) {
    const agent = this.getAgent(completedId);
    if (!agent?.config.pipeline) return;
    const pipelineIds = (agent.config.pipeline_ids as string[]) || [];
    const nextId = agent.config.pipeline_next as string | null;

    if (!nextId) {
      // Final stage — optional crew summary artifact
      const crew = pipelineIds
        .map((id) => this.getAgent(id))
        .filter(Boolean) as Agent[];
      if (crew.length > 1) {
        const markdown = buildPipelineSummaryMarkdown(crew, (id) =>
          this.getLatestArtifactForAgent(id)
        );
        this.saveArtifact({
          agent_id: completedId,
          user_id: agent.user_id,
          title: `Pipeline summary: ${String(agent.config.theme ?? agent.name)}`,
          content_markdown: markdown,
          kind: 'report',
        });
        this.addLog(completedId, 'result', 'Pipeline summary artifact saved', {
          i18nKey: 'log.pipelineSummarySaved',
          type: 'handoff',
          pipeline_id: agent.config.pipeline_id,
        });
      }
      return;
    }

    const next = this.getAgent(nextId);
    if (!next) return;
    const index = Number(next.config.pipeline_index ?? 0);
    const gate = canStartPipelineStage({
      index,
      pipelineIds,
      getAgent: (id) => this.getAgent(id),
      getArtifact: (id) => this.getLatestArtifactForAgent(id),
    });
    if (!gate.ok) {
      this.addLog(nextId, 'action', `Pipeline gated: ${gate.detail}`, {
        type: 'handoff',
        reason: gate.reason,
        pipeline_id: agent.config.pipeline_id,
        i18nKey: 'log.pipelineGated',
        i18nParams: { detail: gate.detail },
      });
      slog('pipeline.handoff', {
        from: completedId,
        to: nextId,
        ok: false,
        reason: gate.reason,
        detail: gate.detail,
      });
      if (gate.reason === 'blocked') {
        this.updateAgent(nextId, {
          status: 'idle',
          current_task: `Pipeline halted: ${gate.detail}`,
        });
      }
      return;
    }

    const upstream = collectUpstreamMarkdown(
      (id) => this.getLatestArtifactForAgent(id),
      pipelineIds,
      index
    );
    const nextLocale =
      agent.config.locale === 'ja' || agent.config.locale === 'en'
        ? agent.config.locale
        : undefined;
    this.updateAgent(nextId, {
      config: {
        ...next.config,
        upstream_reports: upstream,
        ...(nextLocale ? { locale: nextLocale } : {}),
      },
      current_task: `Continuing pipeline after ${agent.name}`,
    });
    const handoffLocale =
      agent.config.locale === 'ja' || agent.config.locale === 'en'
        ? agent.config.locale
        : 'en';
    this.addLog(nextId, 'action', `Handoff from ${agent.name} (${upstream.length} chars upstream)`, {
      type: 'handoff',
      from: completedId,
      pipeline_id: agent.config.pipeline_id,
      i18nKey: 'log.handoffFromChars',
      i18nParams: {
        name: agentLabel(agent.name, handoffLocale),
        n: upstream.length,
      },
    });
    slog('pipeline.handoff', {
      from: completedId,
      to: nextId,
      ok: true,
      upstreamChars: upstream.length,
      pipelineId: agent.config.pipeline_id,
    });
    await this.startRuntime(nextId, null, nextLocale);
  }

  private makeSink(agentId: string) {
    return {
      log: (
        type: AgentLog['type'],
        content: string,
        metadata: Record<string, unknown> = {}
      ) => {
        if (this.runtimeAbort.has(agentId)) return;
        this.addLog(agentId, type, content, metadata);
      },
      setStatus: (status: Agent['status'], currentTask?: string) => {
        if (this.runtimeAbort.has(agentId)) return;
        this.updateAgent(agentId, {
          status,
          ...(currentTask !== undefined ? { current_task: currentTask } : {}),
        });
      },
      escalate: (
        summary: string,
        options: string[],
        context?: Record<string, unknown>
      ) => {
        if (this.runtimeAbort.has(agentId)) return;
        this.createEscalation({ agent_id: agentId, summary, options, context });
      },
      saveReport: (title: string, markdown: string) => {
        if (this.runtimeAbort.has(agentId)) return;
        const agent = this.getAgent(agentId);
        if (!agent) return;
        this.saveArtifact({
          agent_id: agentId,
          user_id: agent.user_id,
          title,
          content_markdown: markdown,
        });
      },
      trackUsage: (delta: {
        agentRuns?: number;
        toolCalls?: number;
        tokensApprox?: number;
      }) => {
        this.usage.agentRuns += delta.agentRuns ?? 0;
        this.usage.toolCalls += delta.toolCalls ?? 0;
        this.usage.tokensApprox += delta.tokensApprox ?? 0;
      },
      getPermission: (tool: ToolName): PermissionLevel => {
        const agent = this.getAgent(agentId);
        return normalizePermission(agent?.permissions?.[tool]);
      },
    };
  }

  stopRuntime(agentId: string) {
    this.runtimeAbort.add(agentId);
    this.running.delete(agentId);
    releaseAgentLock(agentId);
    this.updateAgent(agentId, {
      status: 'idle',
      current_task: 'Stopped by user',
    });
    this.addLog(agentId, 'error', 'Stopped by user', {
      code: 'cancelled',
      i18nKey: 'log.stoppedByUser',
    });
    slog('agent.error', { agentId, code: 'cancelled' });
  }

  assertUsageBudget(userId: string) {
    const plan = this.getPlan(userId);
    const limits = PLAN_LIMITS[plan];
    const hardRuns = Math.ceil(limits.maxAgentRuns * 1.2);
    const hardTokens = Math.ceil(limits.maxTokensApprox * 1.2);
    const upgrade_to =
      plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale';

    if (this.usage.agentRuns >= hardRuns) {
      slog('plan.limit_hit', { userId, plan, metric: 'agentRuns', value: this.usage.agentRuns });
      const err = new Error(
        `Plan limit: ${limits.label} hard cap (~${hardRuns} runs) reached.`
      ) as Error & {
        code: string;
        upgrade_to: string;
        plan: string;
        n: number;
        metric: string;
      };
      err.code = 'USAGE_LIMIT';
      err.upgrade_to = upgrade_to;
      err.plan = plan;
      err.n = hardRuns;
      err.metric = 'agentRuns';
      throw err;
    }
    if (this.usage.tokensApprox >= hardTokens) {
      slog('plan.limit_hit', {
        userId,
        plan,
        metric: 'tokensApprox',
        value: this.usage.tokensApprox,
      });
      const err = new Error(
        `Plan limit: ${limits.label} hard token cap (~${hardTokens}) reached.`
      ) as Error & {
        code: string;
        upgrade_to: string;
        plan: string;
        n: number;
        metric: string;
      };
      err.code = 'USAGE_LIMIT';
      err.upgrade_to = upgrade_to;
      err.plan = plan;
      err.n = hardTokens;
      err.metric = 'tokensApprox';
      throw err;
    }
    if (this.usage.agentRuns >= limits.maxAgentRuns) {
      slog('plan.limit_soft', { userId, plan, metric: 'agentRuns', value: this.usage.agentRuns });
    }
    if (this.usage.tokensApprox >= limits.maxTokensApprox) {
      slog('plan.limit_soft', {
        userId,
        plan,
        metric: 'tokensApprox',
        value: this.usage.tokensApprox,
      });
    }
  }

  async startRuntime(
    agentId: string,
    humanGuidance?: string | null,
    locale?: 'en' | 'ja'
  ) {
    let agent = this.getAgent(agentId);
    if (!agent) return;

    if (locale) {
      agent =
        this.updateAgent(agentId, {
          config: { ...agent.config, locale },
        }) ?? agent;
    }

    if (
      agent.status === 'running' ||
      this.running.has(agentId) ||
      !tryAcquireAgentLock(agentId)
    ) {
      throw new RuntimeError('conflict', 'Agent is already running');
    }

    this.runtimeAbort.delete(agentId);
    this.assertUsageBudget(agent.user_id);

    // Cookie slim may drop system_prompt — restore from bundled template
    if (!agent.config.system_prompt && agent.template_id) {
      const tmpl = getBundledTemplate(agent.template_id);
      const raw = tmpl?.agent_definitions.find((d) => d.name === agent!.name);
      if (raw?.system_prompt) {
        const loc =
          agent.config.locale === 'ja' || agent.config.locale === 'en'
            ? agent.config.locale
            : 'en';
        const def = localizeAgentDefinition(raw, loc);
        agent =
          this.updateAgent(agentId, {
            config: {
              ...agent.config,
              system_prompt: def.system_prompt,
              goal: def.goal,
            },
          }) ?? agent;
      }
    }

    // Refresh upstream for pipeline followers at start time
    if (agent.config.pipeline && Number(agent.config.pipeline_index) > 0) {
      const pipelineIds = (agent.config.pipeline_ids as string[]) || [];
      const index = Number(agent.config.pipeline_index ?? 0);
      const gate = canStartPipelineStage({
        index,
        pipelineIds,
        getAgent: (id) => this.getAgent(id),
        getArtifact: (id) => this.getLatestArtifactForAgent(id),
      });
      if (!gate.ok) {
        releaseAgentLock(agentId);
        if (gate.reason === 'blocked') {
          this.updateAgent(agentId, {
            status: 'idle',
            current_task: `Pipeline halted: ${gate.detail}`,
          });
          this.addLog(agentId, 'error', gate.detail, { code: 'cancelled', type: 'handoff' });
          slog('pipeline.halted', {
            agentId,
            detail: gate.detail,
            pipelineId: agent.config.pipeline_id,
            index,
          });
          return;
        }
        throw new RuntimeError('conflict', gate.detail);
      }
      const upstream = collectUpstreamMarkdown(
        (id) => this.getLatestArtifactForAgent(id),
        pipelineIds,
        index
      );
      agent =
        this.updateAgent(agentId, {
          config: { ...agent.config, upstream_reports: upstream },
        }) ?? agent;
    }

    this.running.add(agentId);
    try {
      const passLocale =
        locale === 'ja' || locale === 'en'
          ? locale
          : agent.config.locale === 'ja' || agent.config.locale === 'en'
            ? agent.config.locale
            : undefined;
      await executeAgentPass(agent, this.makeSink(agentId), {
        humanGuidance,
        locale: passLocale,
      });
      const after = this.getAgent(agentId);
      if (after?.status === 'completed') {
        await this.continuePipeline(agentId);
      }
    } catch (err) {
      if (err instanceof RuntimeError && err.code === 'conflict') throw err;
      const message = err instanceof Error ? err.message : 'Runtime failed';
      this.addLog(agentId, 'error', message, { code: 'unknown' });
      this.updateAgent(agentId, { status: 'error', current_task: message });
      slog('agent.error', { agentId, message });
    } finally {
      this.running.delete(agentId);
      releaseAgentLock(agentId);
    }
  }

  async resumeAgent(agentId: string, humanResponse: string, locale?: 'en' | 'ja') {
    slog('agent.resume', { agentId });
    await this.startRuntime(agentId, humanResponse, locale);
  }

  async recoverAgent(
    agentId: string,
    opts?: { allowWebSearch?: boolean; locale?: 'en' | 'ja' }
  ) {
    if (opts?.allowWebSearch) {
      const agent = this.getAgent(agentId);
      if (agent) {
        this.updateAgent(agentId, {
          permissions: { ...agent.permissions, web_search: 'allow' },
        });
        this.addLog(agentId, 'action', 'web_search loosened → Allow for retry', {
          i18nKey: 'log.searchAllowedRetry',
        });
      }
    }
    this.addLog(agentId, 'action', 'Recovery / retry requested', {
      i18nKey: 'log.recoveryRequested',
    });
    const agent = this.getAgent(agentId);
    const locale =
      opts?.locale ??
      (agent?.config.locale === 'ja' || agent?.config.locale === 'en'
        ? agent.config.locale
        : 'en');
    const { rt } = await import('@/lib/runtime/locale');
    await this.startRuntime(agentId, rt(locale, 'llm.recoverGuidance'), locale);
  }

  markOnboarded(userId: string) {
    this.onboardedUsers.add(userId);
  }

  isOnboarded(userId: string) {
    return this.onboardedUsers.has(userId);
  }
}

const globalForDemo = globalThis as unknown as { __conductorDemoStoreV2?: DemoStore };

export function getDemoStore() {
  if (!globalForDemo.__conductorDemoStoreV2) {
    globalForDemo.__conductorDemoStoreV2 = new DemoStore();
  }
  return globalForDemo.__conductorDemoStoreV2;
}
