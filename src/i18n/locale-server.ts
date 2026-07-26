import { cookies } from 'next/headers';
import {
  AGENT_LABELS_JA_COOKIE,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  PREFER_JA_SOURCES_COOKIE,
  PREFER_STRUCTURED_JA_COOKIE,
  type Locale,
} from '@/i18n/types';

export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  if (raw === 'ja' || raw === 'en') return raw;
  return DEFAULT_LOCALE;
}

export async function getPreferJaSources(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(PREFER_JA_SOURCES_COOKIE)?.value === '1';
}

export async function getPreferStructuredJa(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(PREFER_STRUCTURED_JA_COOKIE)?.value === '1';
}

export async function getAgentLabelsJa(): Promise<Record<string, string>> {
  const jar = await cookies();
  const raw = jar.get(AGENT_LABELS_JA_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
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
