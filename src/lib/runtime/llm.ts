import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs, streamText, tool } from 'ai';
import { z } from 'zod';
import { webSearch, type SearchResult } from './web-search';
import type { Locale } from '@/i18n/types';
import { DEFAULT_LOCALE } from '@/i18n/types';
import { languageInstruction, rt } from '@/lib/runtime/locale';
import {
  escalateMatchesLocale,
  extractSearchResults,
  reportMatchesLocale,
  structuredEscalateFallback,
} from '@/lib/runtime/locale-text';

export function hasLlmKey() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

function getModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic(process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514');
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(process.env.OPENAI_MODEL || 'gpt-4o-mini');
}

/** Skip expensive rewrite for long English bodies; use structured report instead. */
export const REPORT_REWRITE_SKIP_CHARS = 3500;

export type RewriteSkipReason = 'length' | 'preference' | 'mismatch_after_rewrite';

export type LlmToolEvent =
  | { type: 'tool_call'; tool: string; input: unknown }
  | { type: 'tool_result'; tool: string; output: unknown }
  | { type: 'escalate'; summary: string; options: string[] }
  | { type: 'rewrite'; phase: 'report'; attempt: number }
  | { type: 'rewrite_skip'; reason: RewriteSkipReason; chars?: number }
  | { type: 'rewrite_progress'; chars: number };

export type LlmEscalate = {
  summary: string;
  options: string[];
  languageMismatch?: boolean;
  summaryKey?: string;
  summaryParams?: Record<string, string | number>;
  optionKeys?: string[];
  findings?: SearchResult[];
};

async function rewriteEscalateJapanese(
  escalated: { summary: string; options: string[] },
  attempt: number
): Promise<{ summary: string; options: string[] } | null> {
  const strict =
    attempt > 1
      ? 'STRICT: Every character of summary and each option must be Japanese. No English words except quoted proper nouns. Return ONLY raw JSON, no markdown fences.'
      : 'Rewrite entirely in Japanese. Return ONLY JSON.';
  try {
    const result = await generateText({
      model: getModel(),
      system: [
        languageInstruction('ja'),
        strict,
        'Keep the same meaning and 2–4 short options.',
        'Schema: {"summary":"...","options":["...","..."]}',
      ].join(' '),
      prompt: JSON.stringify(escalated),
      temperature: attempt > 1 ? 0.1 : 0.2,
    });
    const raw = result.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      options?: string[];
    };
    if (
      typeof parsed.summary === 'string' &&
      Array.isArray(parsed.options) &&
      parsed.options.length >= 2
    ) {
      return {
        summary: parsed.summary,
        options: parsed.options.map(String).slice(0, 4),
      };
    }
  } catch {
    // keep original
  }
  return null;
}

async function rewriteReportJapanese(
  markdown: string,
  attempt: number,
  onProgress?: (chars: number) => void
): Promise<string | null> {
  const strict =
    attempt > 1
      ? 'STRICT: Rewrite the entire report body in Japanese. Keep markdown structure. English only inside quoted source titles/URLs. Return ONLY the markdown report, no preamble.'
      : 'Rewrite this markdown report in Japanese. Keep headings and structure. Keep source titles/URLs as-is. Return ONLY markdown.';
  try {
    // Stream tokens so the UI can show progressive “still localizing…” heartbeats
    const result = streamText({
      model: getModel(),
      system: [languageInstruction('ja'), strict].join(' '),
      prompt: markdown.slice(0, 12000),
      temperature: attempt > 1 ? 0.1 : 0.2,
    });
    let chars = 0;
    let lastEmit = 0;
    for await (const delta of result.textStream) {
      chars += delta.length;
      if (chars - lastEmit >= 280) {
        lastEmit = chars;
        onProgress?.(chars);
      }
    }
    const out = (await result.text).trim();
    if (out.length > 40) return out;
  } catch {
    // Fallback: non-streaming once if stream path fails
    try {
      const result = await generateText({
        model: getModel(),
        system: [languageInstruction('ja'), strict].join(' '),
        prompt: markdown.slice(0, 12000),
        temperature: attempt > 1 ? 0.1 : 0.2,
      });
      const out = result.text.trim();
      if (out.length > 40) return out;
    } catch {
      // keep original
    }
  }
  return null;
}

export async function runLlmAgentPass(input: {
  system: string;
  prompt: string;
  allowWebSearch: boolean;
  locale?: Locale;
  theme?: string;
  preferJaSources?: boolean;
  /** Skip report rewrite entirely (Settings / cost preference). */
  preferStructuredJa?: boolean;
  onEvent?: (event: LlmToolEvent) => void;
}): Promise<{
  text: string;
  escalated?: LlmEscalate;
  searchFindings: SearchResult[];
  /** True when JA report rewrite failed — caller should use structured buildReport. */
  reportNeedsStructuredFallback?: boolean;
  rewriteSkipReason?: RewriteSkipReason;
  tokensApprox: number;
}> {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const theme = input.theme ?? 'mission';
  let escalated: LlmEscalate | undefined;
  const searchFindings: SearchResult[] = [];

  const tools = {
    ...(input.allowWebSearch
      ? {
          web_search: tool({
            description: rt(locale, 'llm.webSearchDesc'),
            inputSchema: z.object({
              query: z.string(),
            }),
            execute: async ({ query }) => {
              input.onEvent?.({ type: 'tool_call', tool: 'web_search', input: { query } });
              const results = await webSearch(query, 5, {
                locale,
                preferJaSources: input.preferJaSources,
              });
              searchFindings.push(...results);
              input.onEvent?.({ type: 'tool_result', tool: 'web_search', output: results });
              return {
                results,
                note: rt(locale, 'search.llmResultNote'),
              };
            },
          }),
        }
      : {}),
    escalate_to_human: tool({
      description: rt(locale, 'llm.escalateDesc'),
      inputSchema: z.object({
        summary: z.string().describe(rt(locale, 'llm.escalateSummaryDesc')),
        options: z.array(z.string()).min(2).max(4).describe(rt(locale, 'llm.escalateOptionsDesc')),
      }),
      execute: async ({ summary, options }) => {
        escalated = { summary, options };
        input.onEvent?.({ type: 'escalate', summary, options });
        return { ok: true, paused: true };
      },
    }),
  };

  const system = `${input.system}\n\n${languageInstruction(locale)}`;

  const result = await generateText({
    model: getModel(),
    system,
    prompt: input.prompt,
    tools,
    stopWhen: stepCountIs(6),
    temperature: 0.3,
  });

  let tokensApprox =
    (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);

  if (escalated && !escalateMatchesLocale(escalated.summary, escalated.options, locale)) {
    let recovered: LlmEscalate | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const rewritten = await rewriteEscalateJapanese(escalated, attempt);
      tokensApprox += 400;
      if (
        rewritten &&
        escalateMatchesLocale(rewritten.summary, rewritten.options, locale)
      ) {
        recovered = rewritten;
        break;
      }
      if (rewritten) {
        escalated = { ...rewritten, languageMismatch: true };
      }
    }
    if (recovered) {
      escalated = recovered;
    } else if (locale === 'ja') {
      // Final safety: structured keys so chips localize even if free-form stays messy
      const fallback = structuredEscalateFallback(theme, locale);
      escalated = {
        summary: fallback.summary,
        options: fallback.options,
        summaryKey: fallback.summaryKey,
        summaryParams: fallback.summaryParams,
        optionKeys: fallback.optionKeys,
        languageMismatch: false,
      };
      tokensApprox += 50;
    } else {
      escalated = { ...escalated, languageMismatch: true };
    }
  }

  if (escalated) {
    escalated = {
      ...escalated,
      findings: searchFindings.slice(-5),
    };
  }

  let text = result.text || '';
  let reportNeedsStructuredFallback = false;
  let rewriteSkipReason: RewriteSkipReason | undefined;

  if (
    !escalated &&
    locale === 'ja' &&
    text.trim().length > 40 &&
    !reportMatchesLocale(text, locale)
  ) {
    // Cheap path: long EN bodies or user preference → structured report (no rewrite tokens)
    if (input.preferStructuredJa) {
      reportNeedsStructuredFallback = true;
      rewriteSkipReason = 'preference';
      input.onEvent?.({
        type: 'rewrite_skip',
        reason: 'preference',
        chars: text.length,
      });
    } else if (text.length >= REPORT_REWRITE_SKIP_CHARS) {
      reportNeedsStructuredFallback = true;
      rewriteSkipReason = 'length';
      input.onEvent?.({
        type: 'rewrite_skip',
        reason: 'length',
        chars: text.length,
      });
    } else {
      // At most one rewrite for medium bodies (streamed for progress)
      input.onEvent?.({ type: 'rewrite', phase: 'report', attempt: 1 });
      const rewritten = await rewriteReportJapanese(text, 1, (chars) => {
        input.onEvent?.({ type: 'rewrite_progress', chars });
      });
      tokensApprox += Math.min(800, Math.ceil(text.length / 4));
      if (rewritten && reportMatchesLocale(rewritten, locale)) {
        text = rewritten;
      } else {
        reportNeedsStructuredFallback = true;
        rewriteSkipReason = 'mismatch_after_rewrite';
        input.onEvent?.({
          type: 'rewrite_skip',
          reason: 'mismatch_after_rewrite',
          chars: text.length,
        });
      }
    }
  }

  return {
    text,
    escalated,
    searchFindings,
    reportNeedsStructuredFallback,
    rewriteSkipReason,
    tokensApprox,
  };
}

/** @deprecated helper export for tests */
export { extractSearchResults };
