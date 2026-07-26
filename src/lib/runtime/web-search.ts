/**
 * Lightweight web search for agent tools.
 * Prefers Tavily when TAVILY_API_KEY is set; otherwise DuckDuckGo Instant Answer.
 */

import type { Locale } from '@/i18n/types';
import { DEFAULT_LOCALE } from '@/i18n/types';
import { rt } from '@/lib/runtime/locale';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(
  query: string,
  limit = 5,
  opts?: { locale?: Locale; preferJaSources?: boolean }
): Promise<SearchResult[]> {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const preferJa = Boolean(opts?.preferJaSources) || locale === 'ja';
  const hasCjk = /[\u3040-\u30ff\u4e00-\u9fff]/.test(query);
  // Light bias by default for JA; stronger when preferJaSources is on.
  let effectiveQuery = query;
  if (preferJa && !hasCjk) {
    effectiveQuery = opts?.preferJaSources
      ? `${query} 日本語 日本 市場 競合`
      : `${query} 日本 OR 市場`;
  }
  const tavily = process.env.TAVILY_API_KEY;
  if (tavily) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavily,
          query: effectiveQuery,
          max_results: limit,
          search_depth: 'basic',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: { title?: string; url?: string; content?: string }[];
        };
        return (data.results ?? []).slice(0, limit).map((r) => ({
          title: r.title || rt(locale, 'search.untitled'),
          url: r.url || '',
          snippet: r.content || '',
        }));
      }
    } catch {
      // fall through
    }
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(effectiveQuery)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ConductorAgent/1.0' },
    });
    if (!res.ok) throw new Error('search failed');
    const data = (await res.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      Heading?: string;
      RelatedTopics?: { Text?: string; FirstURL?: string }[];
    };

    const results: SearchResult[] = [];
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
      });
    }
    for (const topic of data.RelatedTopics ?? []) {
      if (topic.Text && results.length < limit) {
        results.push({
          title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 80),
          url: topic.FirstURL || '',
          snippet: topic.Text,
        });
      }
    }

    if (results.length === 0) {
      return [
        {
          title: rt(locale, 'search.searchTitle', { query }),
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: rt(locale, 'search.noResults', { query }),
        },
      ];
    }
    return results.slice(0, limit);
  } catch {
    return [
      {
        title: rt(locale, 'search.offlineTitle', { query }),
        url: '',
        snippet: rt(locale, 'search.offlineSnippet'),
      },
    ];
  }
}
