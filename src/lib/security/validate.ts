/** Input length / shape guards for public and authenticated APIs. */

export function clipTheme(raw: unknown, max = 160): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

export function clipText(raw: unknown, max: number): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

export function sanitizeMarkdown(raw: string, max = 80_000): string {
  // Display-side safety: strip nulls / crazy control chars; keep markdown.
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);
}

export function validateEscalationBody(body: {
  action?: unknown;
  human_response?: unknown;
}): { ok: true; action: 'approve' | 'revise' | 'cancel'; human_response: string } | { ok: false; error: string } {
  const action = String(body.action || '');
  if (!['approve', 'revise', 'cancel'].includes(action)) {
    return { ok: false, error: 'Invalid action' };
  }
  const human_response = clipText(body.human_response, 4000);
  if (!human_response) {
    return { ok: false, error: 'Response required' };
  }
  return {
    ok: true,
    action: action as 'approve' | 'revise' | 'cancel',
    human_response,
  };
}
