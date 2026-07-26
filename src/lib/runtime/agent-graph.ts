/**
 * Thin LangGraph-style surface. The real work lives in executor.ts
 * (structured runtime or Vercel AI SDK when LLM keys are present).
 */

export { executeAgentPass, hasLlmKey } from './executor';
export type { ExecutorSink } from './executor';
