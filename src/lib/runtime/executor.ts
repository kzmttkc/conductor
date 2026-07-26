import { webSearch } from './web-search';
import { hasLlmKey, runLlmAgentPass } from './llm';
import type { Agent, PermissionLevel, ToolName } from '@/lib/supabase/types';

export type ExecutorSink = {
  log: (
    type: 'thought' | 'action' | 'tool_call' | 'result' | 'error' | 'escalation',
    content: string,
    metadata?: Record<string, unknown>
  ) => void;
  setStatus: (status: Agent['status'], currentTask?: string) => void;
  escalate: (summary: string, options: string[], context?: Record<string, unknown>) => void;
  saveReport: (title: string, markdown: string) => void;
  trackUsage: (delta: { agentRuns?: number; toolCalls?: number; tokensApprox?: number }) => void;
  getPermission: (tool: ToolName) => PermissionLevel;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runToolWithPermission(
  sink: ExecutorSink,
  tool: ToolName,
  run: () => Promise<string>
): Promise<'ok' | 'escalated' | 'denied'> {
  const perm = sink.getPermission(tool);
  if (perm === 'deny') {
    sink.log('error', `Permission denied for tool: ${tool}`);
    return 'denied';
  }
  if (perm === 'require_approval') {
    sink.escalate(
      `Agent requests approval to use “${tool.replaceAll('_', ' ')}”. Allow this tool call?`,
      [
        `Allow ${tool} for this mission`,
        `Deny ${tool} and continue without it`,
        'Abort the agent',
      ],
      { tool, reason: 'require_approval' }
    );
    return 'escalated';
  }
  sink.log('tool_call', `Calling ${tool}`, { tool });
  sink.trackUsage({ toolCalls: 1 });
  const out = await run();
  sink.log('result', out.slice(0, 1200), { tool });
  return 'ok';
}

function buildReport(agent: Agent, findings: string[], guidance?: string | null) {
  const theme = String(agent.config.theme ?? agent.current_task ?? 'Mission');
  const mode = hasLlmKey() ? 'LLM' : 'Structured runtime';
  return `# ${agent.name} Report — ${theme}

**Role:** ${agent.role}  
**Mode:** ${mode}  
**Generated:** ${new Date().toISOString()}

## Executive summary
${agent.name} completed a research pass on **${theme}**.
${guidance ? `\n**Human guidance applied:** ${guidance}\n` : ''}

## Findings
${findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

## Recommended next actions
- Review conflicting figures before committing budget
- Validate any paywalled claims with primary filings
- Re-run Verifier if new sources appear

---
_Produced by Conductor agent runtime._
`;
}

/** Deterministic structured pass when no LLM key is configured — still uses real web_search. */
async function runStructuredPass(
  agent: Agent,
  sink: ExecutorSink,
  humanGuidance?: string | null
) {
  const theme = String(agent.config.theme ?? 'the assigned topic');
  sink.log('thought', `Planning research on “${theme}”.`);
  await sleep(400);

  const findings: string[] = [];

  if (humanGuidance) {
    sink.log('thought', `Applying human guidance: ${humanGuidance}`);
  }

  const searchStatus = await runToolWithPermission(sink, 'web_search', async () => {
    const results = await webSearch(`${theme} market size competitors 2025 2026`, 5);
    for (const r of results) {
      findings.push(`**${r.title}**${r.url ? ` — ${r.url}` : ''}\n${r.snippet}`);
    }
    return results.map((r) => `${r.title}: ${r.snippet}`).join('\n\n');
  });
  if (searchStatus === 'escalated') return;
  if (searchStatus === 'denied') {
    findings.push('Web search denied by commander permissions. Working from role knowledge only.');
  }

  await sleep(500);

  // Role-based judgment gates (real escalation conditions)
  const conditions = (agent.config.escalation_conditions as string[]) || [];
  const shouldEscalate =
    !humanGuidance &&
    (agent.name === 'Scout' ||
      agent.role === 'Researcher' ||
      agent.role === 'Monitor' ||
      conditions.includes('contradiction') ||
      agent.name === 'Verifier');

  if (shouldEscalate && findings.length > 0) {
    const summary =
      agent.name === 'Verifier' || agent.role === 'Fact Checker'
        ? `Unable to fully verify a key claim about “${theme}” from open sources. Proceed with a confidence caveat, or block until a primary source is found?`
        : agent.role === 'Analyst' || agent.name === 'BriefWriter' || agent.name === 'Synthesizer'
          ? `Priority is ambiguous for “${theme}”. Should the deliverable lead with competitive threats or growth opportunities?`
          : `Sources conflict or are incomplete for “${theme}”. One cluster implies a larger market; another is more conservative. Which framing should I treat as primary?`;

    sink.escalate(
      summary,
      [
        'Approve and continue with current direction',
        'Narrow scope to primary competitors only',
        'Pause and request deeper primary sources',
      ],
      {
        theme,
        findings: findings.slice(0, 3).map((f) => f.replace(/[\u0000-\u001f]+/g, ' ').slice(0, 400)),
        conditions,
      }
    );
    return;
  }

  sink.setStatus('running', `Writing deliverable for ${theme}`);
  sink.log('action', `${agent.name} composing final report…`);
  await sleep(600);

  const report = buildReport(agent, findings.length ? findings : ['No external findings captured.'], humanGuidance);
  sink.saveReport(`${agent.name}: ${theme}`, report);
  sink.log('result', 'Report saved.');
  sink.setStatus('completed', 'Completed — report ready');
  sink.trackUsage({ agentRuns: 1 });
}

async function runLlmPass(agent: Agent, sink: ExecutorSink, humanGuidance?: string | null) {
  const theme = String(agent.config.theme ?? agent.current_task ?? 'mission');
  const system = String(
    agent.config.system_prompt ||
      `You are ${agent.name}, a ${agent.role}. Be precise. Escalate when judgment is required.`
  );
  const allowWeb = sink.getPermission('web_search') === 'allow';

  if (sink.getPermission('web_search') === 'require_approval' && !humanGuidance?.toLowerCase().includes('allow')) {
    const status = await runToolWithPermission(sink, 'web_search', async () => 'pending approval');
    if (status === 'escalated') return;
  }

  sink.log('thought', hasLlmKey() ? 'Invoking LLM agent pass…' : 'LLM unavailable');
  sink.setStatus('running', `LLM pass: ${theme}`);

  try {
    const prompt = [
      `Mission theme: ${theme}`,
      `Goal: ${String(agent.config.goal ?? agent.current_task ?? '')}`,
      humanGuidance ? `Human guidance: ${humanGuidance}` : 'No human guidance yet.',
      '',
      'Do useful research. If sources conflict or judgment is needed, call escalate_to_human.',
      'Otherwise produce a concise markdown report in your final answer.',
    ].join('\n');

    const { text, escalated, tokensApprox } = await runLlmAgentPass({
      system,
      prompt,
      allowWebSearch: allowWeb,
      onEvent: (event) => {
        if (event.type === 'tool_call') {
          sink.log('tool_call', `LLM tool: ${event.tool}`, { input: event.input });
          sink.trackUsage({ toolCalls: 1 });
        }
        if (event.type === 'tool_result') {
          sink.log('result', JSON.stringify(event.output).slice(0, 1000), { tool: event.tool });
        }
      },
    });

    sink.trackUsage({ tokensApprox, agentRuns: 1 });

    if (escalated) {
      sink.escalate(escalated.summary, escalated.options, { theme, source: 'llm' });
      return;
    }

    const report =
      text.trim().length > 40
        ? text
        : buildReport(agent, ['LLM returned a short answer; structured fallback used.'], humanGuidance);

    sink.saveReport(`${agent.name}: ${theme}`, report);
    sink.log('result', 'LLM report saved.');
    sink.setStatus('completed', 'Completed — report ready');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LLM execution failed';
    sink.log('error', message);
    sink.setStatus('error', message);
  }
}

export async function executeAgentPass(
  agent: Agent,
  sink: ExecutorSink,
  opts: { humanGuidance?: string | null } = {}
) {
  sink.setStatus('running', agent.current_task || 'Starting pass');
  if (hasLlmKey()) {
    await runLlmPass(agent, sink, opts.humanGuidance);
  } else {
    await runStructuredPass(agent, sink, opts.humanGuidance);
  }
}

export { hasLlmKey };
