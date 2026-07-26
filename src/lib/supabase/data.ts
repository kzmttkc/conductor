/**
 * Production Supabase data access layer.
 * Demo Mode uses lib/demo/store.ts instead.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Agent,
  AgentLog,
  Artifact,
  Escalation,
  PermissionLevel,
  PlanTier,
  ToolName,
  UsageStats,
} from '@/lib/supabase/types';
import { PLAN_LIMITS, normalizePermission, TOOL_NAMES } from '@/lib/supabase/types';
import { getBundledTemplate, listBundledTemplates } from '@/lib/templates/catalog';

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error('Supabase client unavailable');
  return supabase;
}

export async function listAgentsForUser(userId: string): Promise<Agent[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Agent[];
}

export async function getAgentForUser(userId: string, agentId: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Agent | null) ?? null;
}

export async function assertAgentCapacity(userId: string, needed: number, plan: PlanTier) {
  const agents = await listAgentsForUser(userId);
  const limit = PLAN_LIMITS[plan].maxAgents;
  if (agents.length + needed > limit) {
    const err = new Error(
      `Plan limit: ${PLAN_LIMITS[plan].label} allows ${limit} agents.`
    ) as Error & { code: string; upgrade_to: string };
    err.code = 'PLAN_LIMIT';
    err.upgrade_to = plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale';
    throw err;
  }
}

export async function assertUsageBudget(userId: string, plan: PlanTier) {
  const usage = await getUsage(userId);
  const limits = PLAN_LIMITS[plan];
  if (usage.agentRuns >= limits.maxAgentRuns) {
    const err = new Error(
      `Plan limit: ${limits.label} allows ~${limits.maxAgentRuns} agent runs this period.`
    ) as Error & { code: string; upgrade_to: string };
    err.code = 'USAGE_LIMIT';
    err.upgrade_to = plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale';
    throw err;
  }
  if (usage.tokensApprox >= limits.maxTokensApprox) {
    const err = new Error(
      `Plan limit: ${limits.label} token budget (~${limits.maxTokensApprox}) reached.`
    ) as Error & { code: string; upgrade_to: string };
    err.code = 'USAGE_LIMIT';
    err.upgrade_to = plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale';
    throw err;
  }
}

export async function listPendingEscalations(userId: string): Promise<Escalation[]> {
  const supabase = await db();
  const { data: agents } = await supabase.from('agents').select('id').eq('user_id', userId);
  const ids = (agents ?? []).map((a) => a.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('escalations')
    .select('*')
    .in('agent_id', ids)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Escalation[];
}

export async function listEscalationsForUser(
  userId: string,
  status?: Escalation['status']
): Promise<Escalation[]> {
  const supabase = await db();
  const { data: agents } = await supabase.from('agents').select('id').eq('user_id', userId);
  const ids = (agents ?? []).map((a) => a.id);
  if (ids.length === 0) return [];
  let q = supabase.from('escalations').select('*').in('agent_id', ids);
  if (status) q = q.eq('status', status);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Escalation[];
}

export async function listArtifactsForUser(userId: string): Promise<Artifact[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Artifact[];
}

export async function getArtifactForUser(userId: string, id: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Artifact | null) ?? null;
}

export async function listLogs(agentId: string): Promise<AgentLog[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AgentLog[];
}

export async function ensureUsageRow(userId: string) {
  const supabase = await db();
  const { data } = await supabase
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await supabase
    .from('usage_stats')
    .insert({ user_id: userId, plan: 'free' })
    .select('*')
    .single();
  if (error) throw error;
  return inserted;
}

export async function getPlan(userId: string): Promise<PlanTier> {
  const row = await ensureUsageRow(userId);
  const plan = row.plan as PlanTier;
  return PLAN_LIMITS[plan] ? plan : 'free';
}

export async function setPlan(userId: string, plan: PlanTier) {
  const supabase = await db();
  await ensureUsageRow(userId);
  const { error } = await supabase
    .from('usage_stats')
    .update({ plan })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getUsage(userId: string): Promise<UsageStats> {
  const row = await ensureUsageRow(userId);
  return {
    agentRuns: row.agent_runs ?? 0,
    toolCalls: row.tool_calls ?? 0,
    escalations: row.escalations ?? 0,
    tokensApprox: row.tokens_approx ?? 0,
    periodStart: row.period_start ?? new Date().toISOString(),
  };
}

export async function bumpUsage(
  userId: string,
  delta: {
    agentRuns?: number;
    toolCalls?: number;
    escalations?: number;
    tokensApprox?: number;
  }
) {
  const supabase = await db();
  const current = await ensureUsageRow(userId);
  const { error } = await supabase
    .from('usage_stats')
    .update({
      agent_runs: (current.agent_runs ?? 0) + (delta.agentRuns ?? 0),
      tool_calls: (current.tool_calls ?? 0) + (delta.toolCalls ?? 0),
      escalations: (current.escalations ?? 0) + (delta.escalations ?? 0),
      tokens_approx: (current.tokens_approx ?? 0) + (delta.tokensApprox ?? 0),
    })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateAgent(
  agentId: string,
  patch: Partial<
    Pick<Agent, 'status' | 'current_task' | 'permissions' | 'config' | 'name' | 'role'>
  >
) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('agents')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', agentId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Agent;
}

export async function insertLog(
  agentId: string,
  type: AgentLog['type'],
  content: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('agent_logs')
    .insert({ agent_id: agentId, type, content, metadata })
    .select('*')
    .single();
  if (error) throw error;
  return data as AgentLog;
}

export async function insertEscalation(input: {
  agent_id: string;
  summary: string;
  options?: string[];
  context?: Record<string, unknown>;
}) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('escalations')
    .insert({
      agent_id: input.agent_id,
      summary: input.summary,
      options: input.options ?? [],
      context: input.context ?? {},
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;
  await updateAgent(input.agent_id, {
    status: 'waiting_human',
    current_task: `Awaiting decision: ${input.summary}`,
  });
  return data as Escalation;
}

export async function insertArtifact(input: {
  agent_id: string;
  user_id: string;
  title: string;
  content_markdown: string;
  kind?: Artifact['kind'];
}) {
  const supabase = await db();
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      agent_id: input.agent_id,
      user_id: input.user_id,
      title: input.title,
      content_markdown: input.content_markdown,
      kind: input.kind ?? 'report',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Artifact;
}

export async function resolveEscalationRow(
  id: string,
  action: 'approve' | 'revise' | 'cancel',
  humanResponse: string
) {
  const supabase = await db();
  const status = action === 'cancel' ? 'cancelled' : 'resolved';
  const { data, error } = await supabase
    .from('escalations')
    .update({
      status,
      human_response: humanResponse,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .single();
  if (error) throw error;
  return data as Escalation;
}

export async function deleteAgent(userId: string, agentId: string) {
  const supabase = await db();
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function createAgentRow(input: {
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
  for (const tool of TOOL_NAMES) {
    if (permissions[tool] === undefined) permissions[tool] = 'deny';
  }

  const supabase = await db();
  const { data, error } = await supabase
    .from('agents')
    .insert({
      user_id: input.user_id,
      name: input.name,
      role: input.role,
      current_task: input.current_task ?? null,
      permissions,
      config: input.config ?? {},
      template_id: input.template_id ?? null,
      status: input.status ?? 'idle',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Agent;
}

export function listTemplates() {
  return listBundledTemplates();
}

export function getTemplate(id: string) {
  return getBundledTemplate(id);
}

export function normalizePermissionsPatch(
  current: Agent['permissions'],
  patch: Record<string, unknown>
): Agent['permissions'] {
  const permissions: Agent['permissions'] = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    permissions[k as ToolName] = normalizePermission(v);
  }
  return permissions;
}

export type { PermissionLevel };
