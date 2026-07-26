import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { webSearch } from './web-search';

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

export type LlmToolEvent =
  | { type: 'tool_call'; tool: string; input: unknown }
  | { type: 'tool_result'; tool: string; output: unknown }
  | { type: 'escalate'; summary: string; options: string[] };

export async function runLlmAgentPass(input: {
  system: string;
  prompt: string;
  allowWebSearch: boolean;
  onEvent?: (event: LlmToolEvent) => void;
}): Promise<{ text: string; escalated?: { summary: string; options: string[] }; tokensApprox: number }> {
  let escalated: { summary: string; options: string[] } | undefined;

  const tools = {
    ...(input.allowWebSearch
      ? {
          web_search: tool({
            description: 'Search the web for primary sources and facts.',
            inputSchema: z.object({
              query: z.string(),
            }),
            execute: async ({ query }) => {
              input.onEvent?.({ type: 'tool_call', tool: 'web_search', input: { query } });
              const results = await webSearch(query, 5);
              input.onEvent?.({ type: 'tool_result', tool: 'web_search', output: results });
              return results;
            },
          }),
        }
      : {}),
    escalate_to_human: tool({
      description:
        'Pause and ask the human commander when judgment is needed (conflict, ambiguity, paywall, unverifiable claim).',
      inputSchema: z.object({
        summary: z.string().describe('One-paragraph decision ask the human can answer in 3 seconds'),
        options: z.array(z.string()).min(2).max(4),
      }),
      execute: async ({ summary, options }) => {
        escalated = { summary, options };
        input.onEvent?.({ type: 'escalate', summary, options });
        return { ok: true, paused: true };
      },
    }),
  };

  const result = await generateText({
    model: getModel(),
    system: input.system,
    prompt: input.prompt,
    tools,
    stopWhen: stepCountIs(6),
    temperature: 0.3,
  });

  const tokensApprox =
    (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);

  return {
    text: result.text || '',
    escalated,
    tokensApprox,
  };
}
