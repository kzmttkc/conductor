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
import { attachPipelineConfig } from '@/lib/runtime/pipeline';
import { getBundledTemplate, listBundledTemplates } from '@/lib/templates/catalog';

/** @deprecated Prefer visitorFromSession — kept for scripts/fixtures */
export const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'commander@conductor.local',
  name: 'Commander',
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
      title: input.title,
      kind: input.kind ?? 'report',
      content_markdown: input.content_markdown,
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
    const escalation: Escalation = {
      id: randomUUID(),
      agent_id: input.agent_id,
      status: 'pending',
      summary: input.summary,
      context: input.context ?? {},
      options: input.options ?? [],
      human_response: null,
      resolved_at: null,
      created_at: this.now(),
    };
    this.escalations.unshift(escalation);
    this.usage.escalations += 1;
    this.updateAgent(input.agent_id, {
      status: 'waiting_human',
      current_task: `Awaiting decision: ${input.summary}`,
    });
    this.addLog(input.agent_id, 'escalation', input.summary, {
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
        current_task: 'Stopped by commander',
      });
      this.addLog(escalation.agent_id, 'action', `Cancelled by human: ${humanResponse}`);
    } else {
      // Permission grants from approval language
      if (/allow web_search|allow browser|allow file_write/i.test(humanResponse)) {
        const agent = this.getAgent(escalation.agent_id);
        if (agent) {
          const permissions = { ...agent.permissions };
          for (const tool of ['web_search', 'browser', 'file_write'] as ToolName[]) {
            if (new RegExp(`allow ${tool}`, 'i').test(humanResponse)) {
              permissions[tool] = 'allow';
            }
            if (new RegExp(`deny ${tool}`, 'i').test(humanResponse)) {
              permissions[tool] = 'deny';
            }
          }
          this.updateAgent(escalation.agent_id, { permissions });
        }
      }

      this.addLog(
        escalation.agent_id,
        'action',
        `Human ${action === 'approve' ? 'approved' : 'revised'}: ${humanResponse}`
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

  launchTemplate(userId: string, templateId: string, theme: string) {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    return template.agent_definitions.map((def) =>
      this.createAgent({
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
      })
    );
  }

  async launchTemplateAndRun(userId: string, templateId: string, theme: string) {
    const created = this.launchTemplate(userId, templateId, theme);
    const meta = getBundledTemplate(templateId);
    const pipeline = Boolean(meta?.pipeline && created.length > 1);
    for (const patch of attachPipelineConfig(created, pipeline)) {
      this.updateAgent(patch.id, { config: patch.config });
    }
    if (pipeline) {
      await this.startRuntime(created[0].id);
    } else {
      await Promise.all(created.map((agent) => this.startRuntime(agent.id)));
    }
    return created.map((a) => this.getAgent(a.id)!);
  }

  private async continuePipeline(completedId: string) {
    const agent = this.getAgent(completedId);
    if (!agent?.config.pipeline) return;
    const nextId = agent.config.pipeline_next as string | null;
    if (!nextId) return;
    const pipelineIds = (agent.config.pipeline_ids as string[]) || [];
    const index = Number(this.getAgent(nextId)?.config.pipeline_index ?? 0);
    const chunks: string[] = [];
    for (let i = 0; i < index; i++) {
      const art = this.getLatestArtifactForAgent(pipelineIds[i]);
      if (art) chunks.push(`### Upstream: ${art.title}\n\n${art.content_markdown}`);
    }
    const next = this.getAgent(nextId);
    if (!next) return;
    this.updateAgent(nextId, {
      config: {
        ...next.config,
        upstream_reports: chunks.join('\n\n---\n\n'),
      },
      current_task: `Continuing pipeline after ${agent.name}`,
    });
    await this.startRuntime(nextId);
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
    this.updateAgent(agentId, {
      status: 'idle',
      current_task: 'Stopped by commander',
    });
    this.addLog(agentId, 'action', 'Stopped by commander');
  }

  assertUsageBudget(userId: string) {
    const plan = this.getPlan(userId);
    const limits = PLAN_LIMITS[plan];
    if (this.usage.agentRuns >= limits.maxAgentRuns) {
      const err = new Error(
        `Plan limit: ${limits.label} allows ~${limits.maxAgentRuns} agent runs this period.`
      ) as Error & { code: string };
      err.code = 'USAGE_LIMIT';
      throw err;
    }
    if (this.usage.tokensApprox >= limits.maxTokensApprox) {
      const err = new Error(
        `Plan limit: ${limits.label} token budget (~${limits.maxTokensApprox}) reached.`
      ) as Error & { code: string };
      err.code = 'USAGE_LIMIT';
      throw err;
    }
  }

  async startRuntime(agentId: string, humanGuidance?: string | null) {
    if (this.running.has(agentId)) return;
    this.runtimeAbort.delete(agentId);
    let agent = this.getAgent(agentId);
    if (!agent) return;

    this.assertUsageBudget(agent.user_id);

    // Cookie slim may drop system_prompt — restore from bundled template
    if (!agent.config.system_prompt && agent.template_id) {
      const tmpl = getBundledTemplate(agent.template_id);
      const def = tmpl?.agent_definitions.find((d) => d.name === agent!.name);
      if (def?.system_prompt) {
        agent =
          this.updateAgent(agentId, {
            config: { ...agent.config, system_prompt: def.system_prompt, goal: def.goal },
          }) ?? agent;
      }
    }

    // Refresh upstream for pipeline followers at start time
    if (agent.config.pipeline && Number(agent.config.pipeline_index) > 0) {
      const pipelineIds = (agent.config.pipeline_ids as string[]) || [];
      const index = Number(agent.config.pipeline_index ?? 0);
      const chunks: string[] = [];
      for (let i = 0; i < index; i++) {
        const art = this.getLatestArtifactForAgent(pipelineIds[i]);
        if (art) chunks.push(`### Upstream: ${art.title}\n\n${art.content_markdown}`);
      }
      agent =
        this.updateAgent(agentId, {
          config: { ...agent.config, upstream_reports: chunks.join('\n\n---\n\n') },
        }) ?? agent;
    }

    this.running.add(agentId);
    try {
      await executeAgentPass(agent, this.makeSink(agentId), { humanGuidance });
      const after = this.getAgent(agentId);
      if (after?.status === 'completed') {
        await this.continuePipeline(agentId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Runtime failed';
      this.addLog(agentId, 'error', message);
      this.updateAgent(agentId, { status: 'error', current_task: message });
    } finally {
      this.running.delete(agentId);
    }
  }

  async resumeAgent(agentId: string, humanResponse: string) {
    await this.startRuntime(agentId, humanResponse);
  }

  async recoverAgent(agentId: string, opts?: { allowWebSearch?: boolean }) {
    if (opts?.allowWebSearch) {
      const agent = this.getAgent(agentId);
      if (agent) {
        this.updateAgent(agentId, {
          permissions: { ...agent.permissions, web_search: 'allow' },
        });
        this.addLog(agentId, 'action', 'Commander loosened web_search → Allow for retry');
      }
    }
    this.addLog(agentId, 'action', 'Commander requested recovery / retry');
    await this.startRuntime(agentId, 'Retry after error. Prefer safe sources.');
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
