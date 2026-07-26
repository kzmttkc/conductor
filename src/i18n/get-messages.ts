import type { Locale } from '@/i18n/types';
import { en, type Messages } from '@/i18n/messages/en';
import { ja } from '@/i18n/messages/ja';

export function getMessages(locale: Locale): Messages {
  return locale === 'ja' ? ja : en;
}

/** Dot-path lookup with optional {n} style interpolation. */
export function translate(
  messages: Messages,
  path: string,
  vars?: Record<string, string | number>
): string {
  const parts = path.split('.');
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  if (typeof cur !== 'string') return path;
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
