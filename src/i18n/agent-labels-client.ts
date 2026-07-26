'use client';

import { AGENT_LABELS_JA_COOKIE } from '@/i18n/types';

export function readAgentLabelsJa(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${AGENT_LABELS_JA_COOKIE}=([^;]*)`)
    );
    if (!match?.[1]) return {};
    const parsed = JSON.parse(decodeURIComponent(match[1])) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'string' && k.trim() && v.trim()) {
        out[k.trim()] = v.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeAgentLabelsJa(map: Record<string, string>) {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (k.trim() && v.trim()) cleaned[k.trim()] = v.trim();
  }
  document.cookie = `${AGENT_LABELS_JA_COOKIE}=${encodeURIComponent(
    JSON.stringify(cleaned)
  )};path=/;max-age=31536000;samesite=lax`;
}

export function parseAgentLabelsJson(raw: string): Record<string, string> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'string' && k.trim() && v.trim()) {
        out[k.trim()] = v.trim();
      }
    }
    return out;
  } catch {
    return null;
  }
}

export function downloadAgentLabelsJa(map: Record<string, string>, filename =
  'conductor-agent-labels-ja.json') {
  const blob = new Blob([JSON.stringify(map, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
