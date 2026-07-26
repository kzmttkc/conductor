export type RuntimeErrorCode =
  | 'tool_error'
  | 'llm_error'
  | 'permission_denied'
  | 'timeout'
  | 'cancelled'
  | 'usage_limit'
  | 'conflict'
  | 'unknown';

export class RuntimeError extends Error {
  code: RuntimeErrorCode;
  constructor(code: RuntimeErrorCode, message: string) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
  }
}

export function classifyError(err: unknown): { code: RuntimeErrorCode; message: string } {
  if (err instanceof RuntimeError) {
    return { code: err.code, message: err.message };
  }
  const message = err instanceof Error ? err.message : 'Runtime failed';
  const lower = message.toLowerCase();
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return { code: 'timeout', message };
  }
  if (lower.includes('permission') || lower.includes('denied')) {
    return { code: 'permission_denied', message };
  }
  if (lower.includes('cancel') || lower.includes('aborted')) {
    return { code: 'cancelled', message };
  }
  if (lower.includes('llm') || lower.includes('openai') || lower.includes('anthropic')) {
    return { code: 'llm_error', message };
  }
  if (lower.includes('tool') || lower.includes('search')) {
    return { code: 'tool_error', message };
  }
  return { code: 'unknown', message };
}

export function shortTaskForError(code: RuntimeErrorCode, message: string) {
  const clipped = message.slice(0, 120);
  return `[${code}] ${clipped}`;
}
