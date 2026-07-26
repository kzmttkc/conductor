export type Locale = 'en' | 'ja';

export const LOCALES: Locale[] = ['en', 'ja'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'conductor_locale';
/** When "1", launches prefer Japanese-biased web search. */
export const PREFER_JA_SOURCES_COOKIE = 'conductor_prefer_ja_sources';
/** When "1", skip LLM report rewrite and use structured buildReport for JA. */
export const PREFER_STRUCTURED_JA_COOKIE = 'conductor_prefer_structured_ja';
/** JSON map of runtime agent name → JA display label. */
export const AGENT_LABELS_JA_COOKIE = 'conductor_agent_labels_ja';
