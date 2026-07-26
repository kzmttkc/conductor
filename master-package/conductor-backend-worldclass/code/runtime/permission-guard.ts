/**
 * Permission guard — call before every tool execution.
 * Integrate into executor.ts / runToolWithPermission paths.
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
      reason: `Tool "${tool}" is denied by commander permissions.`,
    };
  }
  // require_approval
  return {
    ok: false,
    level: 'require_approval',
    reason: `Tool "${tool}" requires commander approval before use.`,
  };
}

/**
 * Example integration in executor:
 *
 * const decision = checkToolPermission(agent, 'web_search');
 * if (!decision.ok) {
 *   if (decision.level === 'require_approval') {
 *     sink.escalate(decision.reason, [
 *       'Allow this tool and continue',
 *       'Deny and continue without it',
 *       'Abort mission',
 *     ], { tool: 'web_search' });
 *     return;
 *   }
 *   sink.log('error', decision.reason);
 *   // continue without the tool or stop
 * }
 */
