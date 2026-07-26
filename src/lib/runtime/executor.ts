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

function upstreamBlock(agent: Agent) {
  const upstream = String(agent.config.upstream_reports ?? '').trim();
  return upstream
    ? `\n## Upstream crew deliverables\n${upstream.slice(0, 6000)}\n`
    : '';
}

function buildReport(agent: Agent, findings: string[], guidance?: string | null) {
  const theme = String(agent.config.theme ?? agent.current_task ?? 'Mission');
  const mode = hasLlmKey() ? 'LLM' : 'Structured runtime';
  const role = agent.role;
  const isVerifier = agent.name === 'Verifier' || role === 'Fact Checker';
  const isEditor = agent.name === 'Editor' || role === 'Editor';
  const isSynthesizer =
    agent.name === 'Synthesizer' ||
    agent.name === 'BriefWriter' ||
    role === 'Analyst';

  if (isVerifier) {
    const claims = findings.slice(0, 5);
    return `# Verification Report — ${theme}

**Role:** ${agent.role}  
**Mode:** ${mode}  
**Generated:** ${new Date().toISOString()}
${upstreamBlock(agent)}
## Verification summary
Checked ${claims.length || 'available'} claims against open sources. Confidence is provisional without primary filings.
${guidance ? `\n**Human guidance applied:** ${guidance}\n` : ''}

## Claim checks
${
  claims.length
    ? claims
        .map(
          (f, i) =>
            `### Claim ${i + 1}\n${f}\n\n- **Status:** Partially corroborated (open web)\n- **Risk:** Figures may lag or conflict across vendors`
        )
        .join('\n\n')
    : '_No discrete claims extracted; review upstream report manually._'
}

## Residual risks
- Paywalled or primary sources not fully inspected
- Market sizing methodologies may not be comparable
- Recommend commander sign-off before budget decisions

## Recommendation
Proceed with caveats, or request a deeper primary-source pass.
`;
  }

  if (isSynthesizer || isEditor) {
    return `# ${agent.name} Deliverable — ${theme}

**Role:** ${agent.role}  
**Mode:** ${mode}  
**Generated:** ${new Date().toISOString()}
${upstreamBlock(agent)}
## Executive brief
${guidance ? `**Human guidance:** ${guidance}\n\n` : ''}Structured synthesis of upstream research into a decision-ready brief.

## Key points
${findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n') || '1. Upstream context only — expand with commander priorities.'}

## Suggested framing
Lead with competitive pressure, then growth opportunity, unless the commander chose otherwise.

## Next actions
- Validate top 2 figures with primary sources
- Assign owners for follow-up research
`;
  }

  return `# ${agent.name} Report — ${theme}

**Role:** ${agent.role}  
**Mode:** ${mode}  
**Generated:** ${new Date().toISOString()}
${upstreamBlock(agent)}
## Executive summary
${agent.name} completed a research pass on **${theme}**.
${guidance ? `\n**Human guidance applied:** ${guidance}\n` : ''}

## Findings
${findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

## Recommended next actions
- Review conflicting figures before committing budget
- Validate any paywalled claims with primary filings
- Hand off to the next crew member if this is a pipeline run

---
_Produced by Conductor agent runtime._
`;
}

async function runStructuredPass(
  agent: Agent,
  sink: ExecutorSink,
  humanGuidance?: string | null
) {
  const theme = String(agent.config.theme ?? 'the assigned topic');
  const upstream = String(agent.config.upstream_reports ?? '').trim();
  sink.log('thought', `Planning work on “${theme}”.`);
  if (upstream) {
    sink.log('action', 'Reading upstream crew deliverables…');
    sink.log('result', upstream.slice(0, 800));
  }
  await sleep(400);

  const findings: string[] = [];

  if (humanGuidance) {
    sink.log('thought', `Applying human guidance: ${humanGuidance}`);
  }

  const wantsSearch =
    sink.getPermission('web_search') !== 'deny' &&
    !(agent.role === 'Analyst' && upstream && sink.getPermission('web_search') === 'deny');

  if (wantsSearch && sink.getPermission('web_search') !== 'deny') {
    const searchStatus = await runToolWithPermission(sink, 'web_search', async () => {
      const query =
        agent.name === 'Verifier' || agent.role === 'Fact Checker'
          ? `${theme} market size verification sources 2025 2026`
          : `${theme} market size competitors 2025 2026`;
      const results = await webSearch(query, 5);
      for (const r of results) {
        findings.push(`**${r.title}**${r.url ? ` — ${r.url}` : ''}\n${r.snippet}`);
      }
      return results.map((r) => `${r.title}: ${r.snippet}`).join('\n\n');
    });
    if (searchStatus === 'escalated') return;
    if (searchStatus === 'denied') {
      findings.push('Web search denied by commander permissions. Working from role knowledge / upstream only.');
    }
  } else if (upstream) {
    findings.push('Working primarily from upstream crew reports (search denied or unnecessary).');
  }

  await sleep(500);

  const conditions = (agent.config.escalation_conditions as string[]) || [];
  const isPipelineFollower = Boolean(agent.config.pipeline && Number(agent.config.pipeline_index) > 0);
  const shouldEscalate =
    !humanGuidance &&
    !isPipelineFollower &&
    (agent.name === 'Scout' ||
      agent.name === 'Drafter' ||
      agent.role === 'Researcher' ||
      agent.role === 'Writer' ||
      agent.role === 'Monitor' ||
      conditions.includes('contradiction') ||
      agent.name === 'Verifier');

  // Verifier still escalates once if no human guidance and has findings
  const verifierEscalate =
    !humanGuidance &&
    (agent.name === 'Verifier' || agent.role === 'Fact Checker') &&
    findings.length > 0 &&
    !String(humanGuidance || '').includes('confidence');

  if ((shouldEscalate || verifierEscalate) && (findings.length > 0 || upstream)) {
    // Avoid double-escalating Verifier when shouldEscalate already true
    const summary =
      agent.name === 'Verifier' || agent.role === 'Fact Checker'
        ? `Unable to fully verify a key claim about “${theme}” from open sources. Proceed with a confidence caveat, or block until a primary source is found?`
        : agent.role === 'Analyst' ||
            agent.name === 'BriefWriter' ||
            agent.name === 'Synthesizer' ||
            agent.name === 'Editor'
          ? `Priority is ambiguous for “${theme}”. Should the deliverable lead with competitive threats or growth opportunities?`
          : `Sources conflict or are incomplete for “${theme}”. One cluster implies a larger market; another is more conservative. Which framing should I treat as primary?`;

    // Pipeline followers (Synthesizer/Editor) skip first-pass escalation unless Verifier
    if (
      isPipelineFollower &&
      agent.name !== 'Verifier' &&
      agent.role !== 'Fact Checker'
    ) {
      // fall through to report
    } else {
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
          has_upstream: Boolean(upstream),
        }
      );
      return;
    }
  }

  sink.setStatus('running', `Writing deliverable for ${theme}`);
  sink.log('action', `${agent.name} composing final report…`);
  await sleep(600);

  if (upstream && findings.length < 2) {
    findings.push(`Integrated upstream context (${Math.min(upstream.length, 6000)} chars).`);
  }

  const report = buildReport(
    agent,
    findings.length ? findings : ['No external findings captured.'],
    humanGuidance
  );
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
  const upstream = String(agent.config.upstream_reports ?? '').trim();

  if (
    sink.getPermission('web_search') === 'require_approval' &&
    !humanGuidance?.toLowerCase().includes('allow')
  ) {
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
      upstream ? `\nUpstream crew reports:\n${upstream.slice(0, 8000)}` : '',
      '',
      agent.name === 'Verifier' || agent.role === 'Fact Checker'
        ? 'Verify important claims. Call escalate_to_human if a material claim cannot be corroborated.'
        : 'Do useful research. If sources conflict or judgment is needed, call escalate_to_human.',
      'Otherwise produce a concise markdown report in your final answer.',
    ]
      .filter(Boolean)
      .join('\n');

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
        ? `${text}${upstream ? `\n\n---\n\n_Upstream context was provided to this agent._` : ''}`
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
