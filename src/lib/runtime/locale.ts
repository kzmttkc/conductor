import type { Agent } from '@/lib/supabase/types';
import type { Locale } from '@/i18n/types';
import { DEFAULT_LOCALE } from '@/i18n/types';
import { getMessages, translate } from '@/i18n/get-messages';

export function asLocale(value: unknown): Locale | null {
  return value === 'ja' || value === 'en' ? value : null;
}

/** Prefer agent.config.locale (persisted), then explicit override, then default. */
export function resolveAgentLocale(agent: Agent, override?: Locale | null): Locale {
  return (
    asLocale(agent.config?.locale) ??
    asLocale(override) ??
    DEFAULT_LOCALE
  );
}

export function rt(
  locale: Locale,
  path: string,
  vars?: Record<string, string | number>
): string {
  return translate(getMessages(locale), path, vars);
}

export function languageInstruction(locale: Locale): string {
  if (locale === 'ja') {
    return [
      '【言語ルール・必須】escalate_to_human の summary と options、および最終レポート本文はすべて日本語のみで書くこと。',
      '英語は出典タイトルや固有名詞の引用内だけ許可。選択肢（options）を英語で出してはいけない。',
      '検索結果のタイトル・抜粋は原文のままでよいが、あなたの要約・判断依頼・推奨は日本語にする。',
      'Language rule (mandatory): escalate summary, options, and report body must be Japanese only;',
      'English only inside quoted source titles. Never write option chips in English.',
    ].join(' ');
  }
  return 'Respond in clear English. escalate_to_human summary, options, and the final report must be in English.';
}
