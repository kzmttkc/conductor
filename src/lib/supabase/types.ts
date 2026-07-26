// Conductor 完全型定義

export type AgentStatus = 'idle' | 'running' | 'waiting_human' | 'error' | 'completed';

/** allow = 自由実行 / require_approval = ツール前にエスカレーション / deny = 禁止 */
export type PermissionLevel = 'allow' | 'require_approval' | 'deny';

export type ToolName = 'web_search' | 'browser' | 'file_write';

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  role: string;
  status: AgentStatus;
  current_task: string | null;
  permissions: Partial<Record<ToolName, PermissionLevel | string>>;
  config: Record<string, unknown>;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  type: 'thought' | 'action' | 'tool_call' | 'result' | 'error' | 'escalation';
  content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Escalation {
  id: string;
  agent_id: string;
  status: 'pending' | 'resolved' | 'cancelled';
  summary: string;
  context: Record<string, unknown>;
  options: string[];
  human_response: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Artifact {
  id: string;
  agent_id: string;
  user_id: string;
  title: string;
  kind: 'report' | 'notes' | 'dataset';
  content_markdown: string;
  created_at: string;
}

export interface AgentDefinition {
  name: string;
  role: string;
  goal: string;
  permissions: Partial<Record<ToolName, PermissionLevel | string>>;
  system_prompt: string;
  escalation_conditions: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  agent_definitions: AgentDefinition[];
  is_public: boolean;
  created_at: string;
}

export type PlanTier = 'free' | 'starter' | 'pro' | 'scale';

export interface PlanLimits {
  maxAgents: number;
  label: string;
  price: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { maxAgents: 2, label: 'Free', price: 0 },
  starter: { maxAgents: 5, label: 'Starter', price: 29 },
  pro: { maxAgents: 15, label: 'Pro', price: 79 },
  scale: { maxAgents: 50, label: 'Scale', price: 149 },
};

export interface UsageStats {
  agentRuns: number;
  toolCalls: number;
  escalations: number;
  tokensApprox: number;
  periodStart: string;
}

export const TOOL_NAMES: ToolName[] = ['web_search', 'browser', 'file_write'];

export function normalizePermission(value: unknown): PermissionLevel {
  if (value === 'allow' || value === 'require_approval' || value === 'deny') {
    return value;
  }
  // Legacy boolean-ish strings from master template
  if (value === true || value === 'true') return 'allow';
  return 'deny';
}
