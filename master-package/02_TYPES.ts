// lib/supabase/types.ts
// Conductor 完全型定義

export type AgentStatus = 'idle' | 'running' | 'waiting_human' | 'error' | 'completed';

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  role: string;
  status: AgentStatus;
  current_task: string | null;
  permissions: Record<string, any>;
  config: Record<string, any>;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  type: 'thought' | 'action' | 'tool_call' | 'result' | 'error' | 'escalation';
  content: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Escalation {
  id: string;
  agent_id: string;
  status: 'pending' | 'resolved' | 'cancelled';
  summary: string;
  context: Record<string, any>;
  options: string[];
  human_response: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  agent_definitions: {
    name: string;
    role: string;
    goal: string;
    permissions: Record<string, string>;
    system_prompt: string;
    escalation_conditions: string[];
  }[];
  is_public: boolean;
  created_at: string;
}
