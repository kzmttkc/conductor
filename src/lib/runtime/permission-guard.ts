/**
 * Permission guard — call before every tool execution.
 */

import type { Agent, PermissionLevel, ToolName } from '@/lib/supabase/types';
import { normalizePermission } from '@/lib/supabase/types';

export type PermissionDecision =
  | { ok: true; level: 'allow' }
  | { ok: false; level: 'deny'; reason: string }
  | { ok: false; level: 'require_approval'; reason: string };

export function checkToolPermission(
  agent: Agent,
  tool: ToolName
): PermissionDecision {
  const raw = agent.permissions?.[tool];
  const level: PermissionLevel = normalizePermission(raw);

  if (level === 'allow') {
    return { ok: true, level: 'allow' };
  }
  if (level === 'deny') {
    return {
      ok: false,
      level: 'deny',
      reason: `Tool "${tool}" is denied by your permissions.`,
    };
  }
  return {
    ok: false,
    level: 'require_approval',
    reason: `Tool "${tool}" requires your approval before use.`,
  };
}

export function approvalOptionsForTool(tool: ToolName): string[] {
  // Canonical EN strings — UI localizes; resume matching uses /allow ${tool}/i
  return [
    `Allow ${tool} for this mission`,
    `Deny ${tool} and continue without it`,
    'Abort the agent',
  ];
}
