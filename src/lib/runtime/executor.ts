import { webSearch, WebSearchFailedError } from './web-search';
import { hasLlmKey, runLlmAgentPass } from './llm';
import type { Agent, PermissionLevel, ToolName } from '@/lib/supabase/types';
import {
  approvalOptionsForTool,
  checkToolPermission,
} from '@/lib/runtime/permission-guard';
import { RuntimeError, classifyError, shortTaskForError } from '@/lib/runtime/errors';
import { slog } from '@/lib/runtime/observability';
import type { Locale } from '@/i18n/types';
import { resolveAgentLocale, rt } from '@/lib/runtime/locale';
import {
  clipUpstreamFindings,
  findingsNeedSourceNote,
  formatSearchFinding,
} from '@/lib/runtime/locale-text';
import {
  agentLabel,
  displayNameJaFromConfig,
  roleLabel,
} from '@/lib/templates/ja-overlays';

function labelFor(agent: Agent, locale: Locale) {
  return agentLabel(agent.name, locale, {
    displayNameJa: displayNameJaFromConfig(agent.config),
  });
}

export const AGENT_PASS_TIMEOUT_MS = 110_000;

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
  agent: Agent,
  sink: ExecutorSink,
  tool: ToolName,
  run: () => Promise<string>
): Promise<'ok' | 'escalated' | 'denied'> {
  const decision = checkToolPermission(agent, tool);
  if (!decision.ok && decision.level === 'deny') {
    sink.log('error', decision.reason, {
      code: 'permission_denied',
      tool,
    });
    slog('agent.tool_call', {
      agentId: agent.id,
      tool,
      result: 'permission_denied',
    });
    return 'denied';
  }
  if (!decision.ok && decision.level === 'require_approval') {
    sink.escalate(
      `Agent requests approval to use “${tool.replaceAll('_', ' ')}”. Allow this tool call?`,
      approvalOptionsForTool(tool),
      {
        tool,
        reason: 'require_approval',
        code: 'require_approval',
        summaryKey: 'escalate.summaryTool',
        summaryParams: { tool: tool.replaceAll('_', ' ') },
        locale: resolveAgentLocale(agent),
        optionKeys: [
          'escalate.optionAllowTool',
          'escalate.optionDenyTool',
          'escalate.optionAbort',
        ],
      }
    );
    slog('agent.escalate', { agentId: agent.id, tool, reason: 'require_approval' });
    return 'escalated';
  }

  sink.log('tool_call', `Calling ${tool}`, {
    tool,
    i18nKey: 'log.callingTool',
    i18nParams: { tool },
  });
  slog('agent.tool_call', { agentId: agent.id, tool, result: 'allow' });
  sink.trackUsage({ toolCalls: 1 });
  try {
    const out = await run();
    sink.log('result', out.slice(0, 1200), { tool });
    return 'ok';
  } catch (err) {
    if (err instanceof WebSearchFailedError && tool === 'web_search') {
      const theme = String(agent.config.theme ?? agent.current_task ?? 'mission');
      sink.log('error', err.message, {
        code: 'search_failed',
        tool,
        reason: err.reason,
      });
      slog('agent.tool_call', {
        agentId: agent.id,
        tool,
        result: 'search_failed',
        reason: err.reason,
      });
      sink.escalate(
        `Web search failed for “${theme}”. How should we proceed?`,
        [
          'Retry web search',
          'Check tool permissions and continue without search',
          'Change the research theme',
        ],
        {
          tool,
          reason: 'search_failed',
          code: 'search_failed',
          searchReason: err.reason,
          summaryKey: 'escalate.summarySearchFailed',
          summaryParams: { theme },
          locale: resolveAgentLocale(agent),
          optionKeys: [
            'escalate.optionRetrySearch',
            'escalate.optionSkipSearch',
            'escalate.optionChangeTheme',
          ],
        }
      );
      slog('agent.escalate', {
        agentId: agent.id,
        tool,
        reason: 'search_failed',
      });
      return 'escalated';
    }
    const message = err instanceof Error ? err.message : 'Tool failed';
    sink.log('error', message, { code: 'tool_error', tool });
    throw new RuntimeError('tool_error', message);
  }
}

function upstreamBlock(agent: Agent, locale: Locale) {
  const upstream = String(agent.config.upstream_reports ?? '').trim();
  return upstream
    ? `\n## ${rt(locale, 'report.upstreamReport')}:\n${upstream.slice(0, 6000)}\n`
    : '';
}

function buildReport(
  agent: Agent,
  findings: string[],
  guidance: string | null | undefined,
  locale: Locale
) {
  const theme = String(agent.config.theme ?? agent.current_task ?? 'Mission');
  const mode = hasLlmKey()
    ? rt(locale, 'narrative.modeLlm')
    : rt(locale, 'narrative.modeStructured');
  const role = agent.role;
  const isVerifier = agent.name === 'Verifier' || role === 'Fact Checker';
  const isEditor = agent.name === 'Editor' || role === 'Editor';
  const isSynthesizer =
    agent.name === 'Synthesizer' ||
    agent.name === 'BriefWriter' ||
    role === 'Analyst';

  const displayName = labelFor(agent, locale);
  const displayRole = roleLabel(agent.role, locale);

  if (isVerifier) {
    const claims = findings.slice(0, 5);
    const n = claims.length || '—';
    return `# ${rt(locale, 'report.verificationReport', { theme })}

**${rt(locale, 'report.role')}:** ${displayRole}  
**${rt(locale, 'report.mode')}:** ${mode}  
**${rt(locale, 'report.generated')}:** ${new Date().toISOString()}
${upstreamBlock(agent, locale)}
## ${rt(locale, 'report.verificationSummary')}
${rt(locale, 'narrative.checkedClaims', { n })}
${guidance ? `\n**${rt(locale, 'report.humanGuidanceApplied')}:** ${guidance}\n` : ''}

## ${rt(locale, 'report.claimChecks')}
${
  findingsNeedSourceNote(claims, locale)
    ? `_${rt(locale, 'search.findingsNote')}_\n\n`
    : ''
}${
  claims.length
    ? claims
        .map(
          (f, i) =>
            `### ${rt(locale, 'report.claimN', { n: i + 1 })}\n${f}\n\n- **${rt(locale, 'report.status')}:** ${rt(locale, 'report.partiallyCorroborated')}\n- **${rt(locale, 'report.risk')}:** ${rt(locale, 'report.figuresMayLag')}`
        )
        .join('\n\n')
    : `_${rt(locale, 'report.noClaims')}_`
}

## ${rt(locale, 'report.residualRisks')}
- ${rt(locale, 'narrative.riskPaywall')}
- ${rt(locale, 'narrative.riskSizing')}
- ${rt(locale, 'narrative.riskSignoff')}

## ${rt(locale, 'report.recommendation')}
${rt(locale, 'narrative.proceedCaveats')}
`;
  }

  if (isSynthesizer || isEditor) {
    return `# ${rt(locale, 'report.deliverable', { name: displayName, theme })}

**${rt(locale, 'report.role')}:** ${displayRole}  
**${rt(locale, 'report.mode')}:** ${mode}  
**${rt(locale, 'report.generated')}:** ${new Date().toISOString()}
${upstreamBlock(agent, locale)}
## ${rt(locale, 'report.executiveBrief')}
${guidance ? `**${rt(locale, 'report.humanGuidance')}:** ${guidance}\n\n` : ''}${rt(locale, 'narrative.structuredSynthesis')}

## ${rt(locale, 'report.keyPoints')}
${findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n') || `1. ${rt(locale, 'narrative.upstreamOnlyExpand')}`}

## ${rt(locale, 'report.suggestedFraming')}
${rt(locale, 'narrative.leadCompetitive')}

## ${rt(locale, 'report.nextActions')}
- ${rt(locale, 'narrative.nextValidate')}
- ${rt(locale, 'narrative.nextOwners')}
`;
  }

  return `# ${rt(locale, 'report.agentReport', { name: displayName, theme })}

**${rt(locale, 'report.role')}:** ${displayRole}  
**${rt(locale, 'report.mode')}:** ${mode}  
**${rt(locale, 'report.generated')}:** ${new Date().toISOString()}
${upstreamBlock(agent, locale)}
## ${rt(locale, 'report.executiveSummary')}
${rt(locale, 'narrative.completedPass', { name: displayName, theme })}
${guidance ? `\n**${rt(locale, 'report.humanGuidanceApplied')}:** ${guidance}\n` : ''}

## ${rt(locale, 'report.findings')}
${
  findingsNeedSourceNote(findings, locale)
    ? `_${rt(locale, 'search.findingsNote')}_\n\n`
    : ''
}${findings.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

## ${rt(locale, 'report.recommendedNext')}
- ${rt(locale, 'narrative.nextConflict')}
- ${rt(locale, 'narrative.nextPaywall')}
- ${rt(locale, 'narrative.nextHandoff')}

---
_${rt(locale, 'report.producedBy')}_
`;
}

async function runStructuredPass(
  agent: Agent,
  sink: ExecutorSink,
  humanGuidance: string | null | undefined,
  locale: Locale
) {
  const theme = String(agent.config.theme ?? 'the assigned topic');
  const upstream = String(agent.config.upstream_reports ?? '').trim();
  sink.log('thought', `Planning work on “${theme}”.`, {
    i18nKey: 'log.planningTheme',
    i18nParams: { theme },
  });
  if (upstream) {
    sink.log('action', 'Upstream report: ingesting prior crew deliverable', {
      event: 'pipeline.handoff',
      chars: upstream.length,
      i18nKey: 'log.upstreamIngest',
    });
    sink.log('result', `Upstream report:\n${upstream.slice(0, 800)}`);
  }
  await sleep(400);

  const findings: string[] = [];

  if (humanGuidance) {
    sink.log('thought', `Applying human guidance: ${humanGuidance}`, {
      i18nKey: 'log.applyingGuidance',
      i18nParams: { guidance: humanGuidance },
    });
  }

  const wantsSearch =
    sink.getPermission('web_search') !== 'deny' &&
    !(agent.role === 'Analyst' && upstream && sink.getPermission('web_search') === 'deny');

  if (wantsSearch && sink.getPermission('web_search') !== 'deny') {
    const searchStatus = await runToolWithPermission(agent, sink, 'web_search', async () => {
      const query =
        agent.name === 'Verifier' || agent.role === 'Fact Checker'
          ? `${theme} market size verification sources 2025 2026`
          : `${theme} market size competitors 2025 2026`;
      const results = await webSearch(query, 5, {
        locale,
        preferJaSources: Boolean(agent.config.prefer_ja_sources),
      });
      for (const r of results) {
        findings.push(formatSearchFinding(r, locale));
      }
      return results.map((r) => `${r.title}: ${r.snippet}`).join('\n\n');
    });
    if (searchStatus === 'escalated') return;
    if (searchStatus === 'denied') {
      findings.push(rt(locale, 'report.searchDenied'));
    }
  } else if (upstream) {
    findings.push(rt(locale, 'report.upstreamOnly'));
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
      const summaryKey =
        agent.name === 'Verifier' || agent.role === 'Fact Checker'
          ? 'escalate.summaryVerify'
          : agent.role === 'Analyst' ||
              agent.name === 'BriefWriter' ||
              agent.name === 'Synthesizer' ||
              agent.name === 'Editor'
            ? 'escalate.summaryPriority'
            : 'escalate.summaryConflict';
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
          locale,
          summaryKey,
          summaryParams: { theme },
          optionKeys: [
            'escalate.optionApproveContinue',
            'escalate.optionNarrowCompetitors',
            'escalate.optionPauseDeeper',
          ],
        }
      );
      slog('agent.escalate', { agentId: agent.id, source: 'structured', theme });
      return;
    }
  }

  sink.setStatus('running', `Writing deliverable for ${theme}`);
  sink.log('action', `${agent.name} composing final report…`, {
    i18nKey: 'log.composingReport',
    i18nParams: { name: labelFor(agent, locale) },
  });
  await sleep(600);

  if (upstream && findings.length < 2) {
    findings.push(
      rt(locale, 'report.integratedUpstream', {
        n: Math.min(upstream.length, 6000),
      })
    );
  }

  const report = buildReport(
    agent,
    findings.length ? findings : [rt(locale, 'report.noFindings')],
    humanGuidance,
    locale
  );
  sink.saveReport(`${labelFor(agent, locale)}: ${theme}`, report);
  sink.log('result', 'Report saved.', { i18nKey: 'log.reportSaved' });
  sink.setStatus('completed', 'Completed — report ready');
  sink.trackUsage({ agentRuns: 1 });
  slog('agent.complete', { agentId: agent.id, name: agent.name, mode: 'structured' });
}

async function runLlmPass(
  agent: Agent,
  sink: ExecutorSink,
  humanGuidance: string | null | undefined,
  locale: Locale
) {
  const theme = String(agent.config.theme ?? agent.current_task ?? 'mission');
  const system = String(
    agent.config.system_prompt ||
      rt(locale, 'llm.defaultSystem', {
        name: labelFor(agent, locale),
        role: roleLabel(agent.role, locale),
      })
  );
  const allowWeb = sink.getPermission('web_search') === 'allow';
  const preferJaSources = Boolean(agent.config.prefer_ja_sources);
  const preferStructuredJa = Boolean(agent.config.prefer_structured_ja);
  const upstream = String(agent.config.upstream_reports ?? '').trim();

  if (
    sink.getPermission('web_search') === 'require_approval' &&
    !humanGuidance?.toLowerCase().includes('allow')
  ) {
    const status = await runToolWithPermission(
      agent,
      sink,
      'web_search',
      async () => 'pending approval'
    );
    if (status === 'escalated') return;
  }

  sink.log(
    'thought',
    hasLlmKey() ? 'Invoking LLM agent pass…' : 'LLM unavailable',
    { i18nKey: hasLlmKey() ? 'log.invokingLlm' : 'log.llmUnavailable' }
  );
  sink.setStatus('running', `LLM pass: ${theme}`);

  try {
    const prompt = [
      rt(locale, 'llm.missionTheme', { theme }),
      rt(locale, 'llm.goalLine', {
        goal: String(agent.config.goal ?? agent.current_task ?? ''),
      }),
      humanGuidance
        ? rt(locale, 'llm.humanGuidance', { guidance: humanGuidance })
        : rt(locale, 'llm.noGuidance'),
      upstream ? `\n${rt(locale, 'report.upstreamReport')}:\n${upstream.slice(0, 8000)}` : '',
      '',
      agent.name === 'Verifier' || agent.role === 'Fact Checker'
        ? rt(locale, 'llm.verifyInstruction')
        : rt(locale, 'llm.researchInstruction'),
      rt(locale, 'llm.finalMarkdown'),
    ]
      .filter(Boolean)
      .join('\n');

    const {
      text,
      escalated,
      searchFindings,
      reportNeedsStructuredFallback,
      rewriteSkipReason,
      tokensApprox,
    } = await runLlmAgentPass({
      system,
      prompt,
      allowWebSearch: allowWeb,
      locale,
      theme,
      preferJaSources,
      preferStructuredJa,
      onEvent: (event) => {
        if (event.type === 'tool_call') {
          const toolLabel = rt(locale, `tool.${event.tool}`);
          sink.log('tool_call', `LLM tool: ${event.tool}`, {
            input: event.input,
            i18nKey: 'log.llmTool',
            i18nParams: {
              tool: toolLabel !== `tool.${event.tool}` ? toolLabel : event.tool,
            },
          });
          sink.trackUsage({ toolCalls: 1 });
        }
        if (event.type === 'tool_result') {
          sink.log('result', JSON.stringify(event.output).slice(0, 1000), { tool: event.tool });
        }
        if (event.type === 'rewrite') {
          sink.setStatus('running', rt(locale, 'log.rewritingReport'));
          sink.log('thought', 'Localizing report…', {
            i18nKey: 'log.rewritingReport',
            attempt: event.attempt,
          });
        }
        if (event.type === 'rewrite_progress') {
          sink.setStatus(
            'running',
            rt(locale, 'log.rewritingProgress', { n: event.chars })
          );
        }
        if (event.type === 'rewrite_skip') {
          const key =
            event.reason === 'preference'
              ? 'log.rewriteSkippedPreference'
              : event.reason === 'length'
                ? 'log.rewriteSkippedLength'
                : 'log.rewriteSkippedMismatch';
          sink.log('thought', key, {
            i18nKey: key,
            i18nParams: { n: event.chars ?? 0 },
            reason: event.reason,
          });
        }
      },
    });

    sink.trackUsage({ tokensApprox, agentRuns: 1 });

    if (escalated) {
      let findings = (escalated.findings ?? [])
        .slice(0, 5)
        .map((r) =>
          formatSearchFinding(r, locale)
            .replace(/[\u0000-\u001f]+/g, ' ')
            .slice(0, 400)
        );
      if (findings.length === 0 && upstream) {
        findings = clipUpstreamFindings(upstream, locale);
      }
      sink.escalate(escalated.summary, escalated.options, {
        theme,
        source: 'llm',
        locale,
        languageMismatch: Boolean(escalated.languageMismatch),
        findings,
        ...(escalated.summaryKey
          ? {
              summaryKey: escalated.summaryKey,
              summaryParams: escalated.summaryParams ?? { theme },
            }
          : {}),
        ...(escalated.optionKeys ? { optionKeys: escalated.optionKeys } : {}),
      });
      slog('agent.escalate', {
        agentId: agent.id,
        source: 'llm',
        locale,
        languageMismatch: Boolean(escalated.languageMismatch),
        findings: findings.length,
      });
      return;
    }

    const structuredFindings =
      searchFindings.length > 0
        ? searchFindings.map((r) => formatSearchFinding(r, locale))
        : upstream
          ? clipUpstreamFindings(upstream, locale)
          : [rt(locale, 'report.llmFallback')];

    const useStructured =
      text.trim().length <= 40 || Boolean(reportNeedsStructuredFallback);

    let report = useStructured
      ? buildReport(agent, structuredFindings, humanGuidance, locale)
      : `${text}${
          upstream
            ? `\n\n---\n\n_${rt(locale, 'llm.upstreamProvided')}_`
            : ''
        }`;

    if (reportNeedsStructuredFallback && useStructured) {
      report += `\n\n_${rt(locale, 'report.languageFallbackNote')}_`;
    }

    sink.saveReport(`${labelFor(agent, locale)}: ${theme}`, report);
    sink.log('result', 'LLM report saved.', { i18nKey: 'log.llmReportSaved' });
    sink.setStatus('completed', 'Completed — report ready');
    slog('agent.complete', {
      agentId: agent.id,
      name: agent.name,
      mode: 'llm',
      tokensApprox,
      reportFallback: Boolean(reportNeedsStructuredFallback),
      rewriteSkipReason: rewriteSkipReason ?? null,
    });
  } catch (err) {
    const { code, message } = classifyError(
      err instanceof RuntimeError
        ? err
        : new RuntimeError(
            'llm_error',
            err instanceof Error ? err.message : 'LLM execution failed'
          )
    );
    sink.log('error', message, { code });
    sink.setStatus('error', shortTaskForError(code, message));
    slog('agent.error', { agentId: agent.id, code, message });
  }
}

async function runPassInner(
  agent: Agent,
  sink: ExecutorSink,
  humanGuidance: string | null | undefined,
  locale: Locale
) {
  if (hasLlmKey()) {
    await runLlmPass(agent, sink, humanGuidance, locale);
  } else {
    await runStructuredPass(agent, sink, humanGuidance, locale);
  }
}

export async function executeAgentPass(
  agent: Agent,
  sink: ExecutorSink,
  opts: { humanGuidance?: string | null; timeoutMs?: number; locale?: Locale } = {}
) {
  const locale = resolveAgentLocale(agent, opts.locale);
  const timeoutMs = opts.timeoutMs ?? AGENT_PASS_TIMEOUT_MS;
  slog('agent.start', {
    agentId: agent.id,
    name: agent.name,
    locale,
    pipelineIndex: agent.config.pipeline_index ?? null,
    pipelineId: agent.config.pipeline_id ?? null,
  });
  sink.setStatus('running', agent.current_task || 'Starting pass');

  let timedOut = false;
  const timer = new Promise<never>((_, reject) => {
    setTimeout(() => {
      timedOut = true;
      reject(new RuntimeError('timeout', `Agent pass exceeded ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
  });

  try {
    await Promise.race([runPassInner(agent, sink, opts.humanGuidance, locale), timer]);
  } catch (err) {
    const { code, message } = classifyError(err);
    sink.log('error', message, { code, timedOut });
    if (code === 'timeout') {
      const theme = String(agent.config.theme ?? agent.name);
      const seconds = Math.round(timeoutMs / 1000);
      sink.escalate(
        `Pass timed out after ${seconds}s on “${theme}”. Resume with narrower scope, or abort?`,
        [
          'Approve and continue with narrower scope',
          'Retry with current direction',
          'Abort the agent',
        ],
        {
          code: 'timeout',
          locale,
          summaryKey: 'escalate.summaryTimeout',
          summaryParams: { seconds, theme },
          optionKeys: [
            'escalate.optionApproveNarrower',
            'escalate.optionRetryCurrent',
            'escalate.optionAbort',
          ],
        }
      );
      slog('agent.escalate', { agentId: agent.id, reason: 'timeout' });
      return;
    }
    sink.setStatus('error', shortTaskForError(code, message));
    slog('agent.error', { agentId: agent.id, code, message });
  }
}

export { hasLlmKey };
