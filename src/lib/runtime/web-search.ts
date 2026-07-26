/**
 * Lightweight web search for agent tools.
 * Prefers Tavily when TAVILY_API_KEY is set; otherwise DuckDuckGo Instant Answer.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  const tavily = process.env.TAVILY_API_KEY;
  if (tavily) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavily,
          query,
          max_results: limit,
          search_depth: 'basic',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: { title?: string; url?: string; content?: string }[];
        };
        return (data.results ?? []).slice(0, limit).map((r) => ({
          title: r.title || 'Untitled',
          url: r.url || '',
          snippet: r.content || '',
        }));
      }
    } catch {
      // fall through
    }
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
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
          title: `Search: ${query}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `No structured results. Open search for “${query}” manually if needed.`,
        },
      ];
    }
    return results.slice(0, limit);
  } catch {
    return [
      {
        title: `Offline fallback for ${query}`,
        url: '',
        snippet: `Could not reach search APIs. Proceed with caution and escalate if primary sources are required.`,
      },
    ];
  }
}
