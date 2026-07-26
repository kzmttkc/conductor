import type { Locale } from '@/i18n/types';
import { rt } from '@/lib/runtime/locale';
import type { SearchResult } from '@/lib/runtime/web-search';

/** Cheap heuristic: enough CJK to treat as Japanese-facing copy. */
export function looksJapanese(text: string): boolean {
  const jp = (text.match(/[\u3040-\u30ff\u4e00-\u9fff\uff66-\uff9d]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (jp < 4) return false;
  if (latin === 0) return true;
  return jp >= latin * 0.25;
}

/** True when text is mostly Latin (external web titles/snippets). */
export function looksMostlyLatin(text: string): boolean {
  const jp = (text.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin >= 12 && latin > jp * 3;
}

/**
 * JA escalate match: summary must look Japanese, and every option must
 * either look Japanese or be very short (≤2 latin words + CJK).
 */
export function escalateMatchesLocale(
  summary: string,
  options: string[],
  locale: Locale
): boolean {
  if (locale !== 'ja') return true;
  if (!looksJapanese(summary)) return false;
  if (options.length < 2) return false;
  return options.every((opt) => {
    if (looksJapanese(opt)) return true;
    if (looksMostlyLatin(opt)) return false;
    const latin = (opt.match(/[A-Za-z]/g) || []).length;
    const jp = (opt.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
    return jp >= 2 && latin < 20;
  });
}

/**
 * Strip code fences, URLs, and external-source blocks before checking report language.
 * Quoted source titles may stay Latin; the narrative body must look Japanese.
 */
export function stripForReportLocaleCheck(markdown: string): string {
  let md = markdown;
  md = md.replace(/```[\s\S]*?```/g, ' ');
  md = md.replace(/https?:\/\/\S+/gi, ' ');
  md = md.replace(/_\s*(External source \(original language\)|外部ソース（原文）)\s*_[\s\S]*?(?=\n\n|\n#|$)/gi, ' ');
  md = md.replace(/^\|.*\|$/gm, ' ');
  return md;
}

export function reportMatchesLocale(markdown: string, locale: Locale): boolean {
  if (locale !== 'ja') return true;
  const body = stripForReportLocaleCheck(markdown).trim();
  if (body.length < 40) return true;
  return looksJapanese(body);
}

/** Format a search hit for findings — keep original title/snippet; add chrome when JA. */
export function formatSearchFinding(r: SearchResult, locale: Locale): string {
  const body = `**${r.title}**${r.url ? ` — ${r.url}` : ''}\n${r.snippet}`;
  if (locale === 'ja' && looksMostlyLatin(`${r.title}\n${r.snippet}`)) {
    return `_${rt(locale, 'search.externalSource')}_\n${body}`;
  }
  return body;
}

export function findingsNeedSourceNote(findings: string[], locale: Locale): boolean {
  if (locale !== 'ja' || findings.length === 0) return false;
  return findings.some(
    (f) =>
      f.includes(rt(locale, 'search.externalSource')) ||
      looksMostlyLatin(f) ||
      /https?:\/\//i.test(f)
  );
}

/** Clip upstream markdown into escalate finding cards when LLM skipped search. */
export function clipUpstreamFindings(upstream: string, locale: Locale, max = 3): string[] {
  const cleaned = upstream.replace(/[\u0000-\u001f]+/g, ' ').trim();
  if (!cleaned) return [];
  const chunks = cleaned
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter((c) => c.length > 20);
  const picked = (chunks.length ? chunks : [cleaned]).slice(0, max);
  return picked.map(
    (c) =>
      `_${rt(locale, 'report.upstreamReport')}_\n${c.slice(0, 400)}`
  );
}

const STRUCTURED_FALLBACK = {
  summaryKey: 'escalate.summaryConflict' as const,
  optionKeys: [
    'escalate.optionApproveContinue',
    'escalate.optionNarrowCompetitors',
    'escalate.optionPauseDeeper',
  ] as const,
  optionsEn: [
    'Approve and continue with current direction',
    'Narrow scope to primary competitors only',
    'Pause and request deeper primary sources',
  ] as const,
};

/** When LLM rewrite fails, fall back to structured keys so UI can localize chips. */
export function structuredEscalateFallback(theme: string, locale: Locale) {
  return {
    summary: rt(locale, STRUCTURED_FALLBACK.summaryKey, { theme }),
    options: [...STRUCTURED_FALLBACK.optionsEn],
    summaryKey: STRUCTURED_FALLBACK.summaryKey,
    summaryParams: { theme },
    optionKeys: [...STRUCTURED_FALLBACK.optionKeys],
    languageMismatch: false as boolean,
  };
}

export function extractSearchResults(output: unknown): SearchResult[] {
  if (!output || typeof output !== 'object') return [];
  const o = output as { results?: unknown; title?: string };
  if (Array.isArray(o.results)) {
    return o.results
      .filter((r): r is SearchResult => {
        return (
          !!r &&
          typeof r === 'object' &&
          typeof (r as SearchResult).title === 'string'
        );
      })
      .map((r) => ({
        title: r.title,
        url: typeof r.url === 'string' ? r.url : '',
        snippet: typeof r.snippet === 'string' ? r.snippet : '',
      }));
  }
  if (Array.isArray(output)) {
    return extractSearchResults({ results: output });
  }
  return [];
}
