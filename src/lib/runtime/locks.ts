/**
 * Process-local run locks for idempotent agent execution.
 * Prevents concurrent passes on the same agent within one Node process.
 */

const locks = new Map<string, { at: number; owner: string }>();
const DEFAULT_TTL_MS = 130_000;

export function tryAcquireAgentLock(
  agentId: string,
  owner = 'pass',
  ttlMs = DEFAULT_TTL_MS
): boolean {
  const now = Date.now();
  const existing = locks.get(agentId);
  if (existing && now - existing.at < ttlMs) {
    return false;
  }
  locks.set(agentId, { at: now, owner });
  return true;
}

export function releaseAgentLock(agentId: string, owner = 'pass') {
  const existing = locks.get(agentId);
  if (!existing || existing.owner === owner) {
    locks.delete(agentId);
  }
}

export function isAgentLocked(agentId: string, ttlMs = DEFAULT_TTL_MS) {
  const existing = locks.get(agentId);
  if (!existing) return false;
  if (Date.now() - existing.at >= ttlMs) {
    locks.delete(agentId);
    return false;
  }
  return true;
}
