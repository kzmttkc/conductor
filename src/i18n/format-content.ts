/** Localize content-side strings (escalations, artifacts, reports, API errors). */

type TFn = (path: string, vars?: Record<string, string | number>) => string;

const STRUCTURED_OPTION_KEYS: Record<string, string> = {
  'Approve and continue with current direction': 'escalate.optionApproveContinue',
  'Narrow scope to primary competitors only': 'escalate.optionNarrowCompetitors',
  'Pause and request deeper primary sources': 'escalate.optionPauseDeeper',
  'Approve and continue with narrower scope': 'escalate.optionApproveNarrower',
  'Retry with current direction': 'escalate.optionRetryCurrent',
  'Abort the agent': 'escalate.optionAbort',
  'Stop the agent': 'escalate.optionAbort',
};

export function formatEscalationOption(option: string, t: TFn): string {
  const known = STRUCTURED_OPTION_KEYS[option];
  if (known) return t(known);

  let m = option.match(/^Allow (.+) for this (?:mission|run)$/i);
  if (m) return t('escalate.optionAllowTool', { tool: m[1] });

  m = option.match(/^Deny (.+) and continue without it$/i);
  if (m) return t('escalate.optionDenyTool', { tool: m[1] });

  return option;
}

export function formatEscalationSummary(
  summary: string,
  context: Record<string, unknown> | null | undefined,
  t: TFn
): string {
  const key = typeof context?.summaryKey === 'string' ? context.summaryKey : null;
  if (key) {
    const params =
      context?.summaryParams && typeof context.summaryParams === 'object'
        ? (context.summaryParams as Record<string, string | number>)
        : {};
    const out = t(key, params);
    if (out !== key) return out;
  }

  let m = summary.match(
    /^Agent requests approval to use [“"](.+)[”"]\. Allow this tool call\?$/
  );
  if (m) return t('escalate.summaryTool', { tool: m[1] });

  m = summary.match(
    /^Unable to fully verify a key claim about [“"](.+)[”"] from open sources/
  );
  if (m) return t('escalate.summaryVerify', { theme: m[1] });

  m = summary.match(/^Priority is ambiguous for [“"](.+)[”"]\./);
  if (m) return t('escalate.summaryPriority', { theme: m[1] });

  m = summary.match(/^Sources conflict or are incomplete for [“"](.+)[”"]\./);
  if (m) return t('escalate.summaryConflict', { theme: m[1] });

  m = summary.match(/^Pass timed out after (\d+)s on [“"](.+)[”"]\./);
  if (m) return t('escalate.summaryTimeout', { seconds: m[1], theme: m[2] });

  return summary;
}

export function formatEscalationOptions(
  options: string[],
  context: Record<string, unknown> | null | undefined,
  t: TFn
): string[] {
  const keys = Array.isArray(context?.optionKeys)
    ? (context!.optionKeys as string[])
    : null;
  return options.map((opt, i) => {
    const key = keys?.[i];
    if (key) {
      const tool =
        typeof context?.tool === 'string'
          ? String(context.tool).replaceAll('_', ' ')
          : '';
      const out = t(key, tool ? { tool } : undefined);
      if (out !== key) return out;
    }
    return formatEscalationOption(opt, t);
  });
}

export function formatEscalationStatus(status: string, t: TFn): string {
  const key = `status.${status}`;
  const out = t(key);
  return out === key ? status : out;
}

export function formatArtifactKind(kind: string, t: TFn): string {
  const key = `kind.${kind}`;
  const out = t(key);
  return out === key ? kind : out;
}

export function formatArtifactTitle(
  title: string,
  t: TFn,
  opts?: { customMap?: Record<string, string> | null }
): string {
  let m = title.match(/^Pipeline summary:\s*(.+)$/i);
  if (m) return t('artifact.pipelineSummary', { theme: m[1] });

  // Allow multi-word custom names: "My Analyst: theme"
  m = title.match(/^(.+?):\s+(.+)$/);
  if (m) {
    const rawName = m[1];
    const fromMap = opts?.customMap?.[rawName];
    const key = `agentName.${rawName}`;
    const fromMessages = t(key);
    const name =
      fromMap ||
      (fromMessages !== key ? fromMessages : rawName);
    // Avoid rewriting prose titles like "Status: done"
    if (!rawName.includes('.') && rawName.length <= 40) {
      return t('artifact.agentTheme', { name, theme: m[2] });
    }
  }

  return title;
}

/** Detect structured language-fallback note in artifact markdown. */
export function reportHasLanguageFallback(markdown: string, t: TFn): boolean {
  if (!markdown) return false;
  const note = t('report.languageFallbackNote');
  return (
    markdown.includes(note) ||
    markdown.includes(
      'The free-form LLM report stayed mostly English, so Conductor saved a structured Japanese-ready report instead.'
    ) ||
    markdown.includes(
      '自由記述の LLM レポートが英語のままだったため、構造化レポートに差し替えて保存しました。'
    )
  );
}

export function formatEscalationCondition(condition: string, t: TFn): string {
  const key = `condition.${condition}`;
  const out = t(key);
  return out === key ? condition.replaceAll('_', ' ') : out;
}

export function formatApiError(
  data: {
    error?: string;
    code?: string;
    plan?: string;
    limit?: number;
    needed?: number;
    current?: number;
    n?: number;
    metric?: string;
  },
  t: TFn
): string {
  const planLabel = data.plan ? t(`plan.${data.plan}`) : '';
  if (data.code === 'PLAN_LIMIT') {
    if (data.needed != null && data.current != null && data.limit != null) {
      return t('errors.planAgentsCrew', {
        plan: planLabel || data.plan || '',
        limit: data.limit,
        needed: data.needed,
        current: data.current,
      });
    }
    if (data.limit != null) {
      return t('errors.planAgents', {
        plan: planLabel || data.plan || '',
        limit: data.limit,
      });
    }
  }
  if (data.code === 'USAGE_LIMIT') {
    if (data.metric === 'tokensApprox' || /token/i.test(data.error || '')) {
      return t('errors.usageTokens', {
        plan: planLabel || data.plan || '',
        n: data.n ?? data.limit ?? '—',
      });
    }
    return t('errors.usageRuns', {
      plan: planLabel || data.plan || '',
      n: data.n ?? data.limit ?? '—',
    });
  }
  if (data.code === 'RATE_LIMIT') return t('errors.rateLimit');
  return data.error || t('common.failed');
}

/** Localize structured report chrome; leave dynamic findings / LLM body intact. */
export function localizeReportMarkdown(markdown: string, t: TFn): string {
  let md = markdown;

  md = md.replace(
    /^# Verification Report — (.+)$/gm,
    (_, theme) => `# ${t('report.verificationReport', { theme })}`
  );
  md = md.replace(
    /^# Pipeline summary — (.+)$/gm,
    (_, theme) => `# ${t('report.pipelineSummary', { theme })}`
  );
  md = md.replace(
    /^# (.+) Deliverable — (.+)$/gm,
    (_, name, theme) => `# ${t('report.deliverable', { name, theme })}`
  );
  md = md.replace(
    /^# (.+) Report — (.+)$/gm,
    (_, name, theme) => `# ${t('report.agentReport', { name, theme })}`
  );
  md = md.replace(
    /^# Report — (.+)$/gm,
    (_, theme) => `# ${t('report.reportTitle', { theme })}`
  );

  const headers: [RegExp, string][] = [
    [/^## Upstream report:\s*$/gm, `## ${t('report.upstreamReport')}`],
    [/^## Upstream report$/gm, `## ${t('report.upstreamReport')}`],
    [/^## Verification summary$/gm, `## ${t('report.verificationSummary')}`],
    [/^## Claim checks$/gm, `## ${t('report.claimChecks')}`],
    [/^## Residual risks$/gm, `## ${t('report.residualRisks')}`],
    [/^## Recommendation$/gm, `## ${t('report.recommendation')}`],
    [/^## Executive brief$/gm, `## ${t('report.executiveBrief')}`],
    [/^## Executive summary$/gm, `## ${t('report.executiveSummary')}`],
    [/^## Findings$/gm, `## ${t('report.findings')}`],
    [/^## Key points$/gm, `## ${t('report.keyPoints')}`],
    [/^## Suggested framing$/gm, `## ${t('report.suggestedFraming')}`],
    [/^## Next actions$/gm, `## ${t('report.nextActions')}`],
    [/^## Recommended next actions$/gm, `## ${t('report.recommendedNext')}`],
    [/^## Stages$/gm, `## ${t('report.stages')}`],
    [/^## Notes$/gm, `## ${t('report.notes')}`],
  ];
  for (const [re, repl] of headers) {
    md = md.replace(re, repl);
  }

  md = md.replace(/^### Claim (\d+)$/gm, (_, n) => `### ${t('report.claimN', { n })}`);
  md = md.replace(
    /^### Upstream report:\s*(.+)$/gm,
    (_, title) => `### ${t('report.upstreamReport')}: ${title}`
  );

  md = md.replace(/\*\*Role:\*\*/g, `**${t('report.role')}:**`);
  md = md.replace(/\*\*Mode:\*\*/g, `**${t('report.mode')}:**`);
  md = md.replace(/\*\*Generated:\*\*/g, `**${t('report.generated')}:**`);
  md = md.replace(
    /\*\*Human guidance applied:\*\*/g,
    `**${t('report.humanGuidanceApplied')}:**`
  );
  md = md.replace(/\*\*Human guidance:\*\*/g, `**${t('report.humanGuidance')}:**`);
  md = md.replace(/- \*\*Status:\*\*/g, `- **${t('report.status')}:**`);
  md = md.replace(/- \*\*Risk:\*\*/g, `- **${t('report.risk')}:**`);

  md = md.replace(
    /_Produced by Conductor agent runtime\._/g,
    `_${t('report.producedBy')}_`
  );
  md = md.replace(
    /_No discrete claims extracted; review upstream report manually\._/g,
    `_${t('report.noClaims')}_`
  );
  md = md.replace(
    /Partially corroborated \(open web\)/g,
    t('report.partiallyCorroborated')
  );
  md = md.replace(
    /Figures may lag or conflict across vendors/g,
    t('report.figuresMayLag')
  );
  md = md.replace(
    /Web search denied by commander permissions\. Working from role knowledge \/ upstream only\./g,
    t('report.searchDenied')
  );
  md = md.replace(
    /Web search denied by your permissions\. Working from role knowledge \/ upstream only\./g,
    t('report.searchDenied')
  );
  md = md.replace(
    /Working primarily from upstream crew reports \(search denied or unnecessary\)\./g,
    t('report.upstreamOnly')
  );
  md = md.replace(
    /Working primarily from upstream reports \(search denied or unnecessary\)\./g,
    t('report.upstreamOnly')
  );
  md = md.replace(
    /Integrated upstream context \((\d+) chars\)\./g,
    (_, n) => t('report.integratedUpstream', { n })
  );
  md = md.replace(/No external findings captured\./g, t('report.noFindings'));
  md = md.replace(
    /LLM returned a short answer; structured fallback used\./g,
    t('report.llmFallback')
  );

  // Soften commander in residual risks
  md = md.replace(
    /Recommend commander sign-off before budget decisions/g,
    t('narrative.riskSignoff')
  );
  md = md.replace(
    /Recommend your sign-off before budget decisions/g,
    t('narrative.riskSignoff')
  );
  md = md.replace(
    /_External source \(original language\)_/g,
    `_${t('search.externalSource')}_`
  );
  md = md.replace(
    /_外部ソース（原文）_/g,
    `_${t('search.externalSource')}_`
  );
  md = md.replace(
    /Titles and snippets below are shown in the source language\. Conductor does not machine-translate the open web\./g,
    t('search.findingsNote')
  );
  md = md.replace(
    /以下のタイトル・抜粋は検索元の言語のままです。Conductor はオープン Web を機械翻訳しません。/g,
    t('search.findingsNote')
  );
  md = md.replace(
    /The free-form LLM report stayed mostly English, so Conductor saved a structured Japanese-ready report instead\./g,
    t('report.languageFallbackNote')
  );
  md = md.replace(
    /自由記述の LLM レポートが英語のままだったため、構造化レポートに差し替えて保存しました。/g,
    t('report.languageFallbackNote')
  );

  // Search / narrative fallbacks for older EN artifacts
  md = md.replace(
    /No structured results\. Open search for [“"](.+)[”"] manually if needed\./g,
    (_, q) => t('search.noResults', { query: q })
  );
  md = md.replace(
    /Could not reach search APIs\. Proceed with caution and escalate if primary sources are required\./g,
    t('search.offlineSnippet')
  );
  md = md.replace(
    /Checked (\d+|available|—) claims against open sources\. Confidence is provisional without primary filings\./g,
    (_, n) => t('narrative.checkedClaims', { n })
  );
  md = md.replace(
    /Structured synthesis of upstream research into a decision-ready brief\./g,
    t('narrative.structuredSynthesis')
  );
  md = md.replace(
    /Lead with competitive pressure, then growth opportunity, unless you chose otherwise\./g,
    t('narrative.leadCompetitive')
  );
  md = md.replace(
    /Proceed with caveats, or request a deeper primary-source pass\./g,
    t('narrative.proceedCaveats')
  );
  md = md.replace(
    /Upstream report was provided to this agent\./g,
    t('llm.upstreamProvided')
  );
  md = md.replace(/\bStructured runtime\b/g, t('narrative.modeStructured'));
  md = md.replace(
    /\*\*Pipeline id:\*\*/g,
    `**${t('narrative.pipelineId')}:**`
  );
  md = md.replace(
    /\*\*Completed:\*\*/g,
    `**${t('narrative.pipelineCompleted')}:**`
  );
  md = md.replace(
    /All stage reports are available as individual artifacts\. This summary marks the (?:crew|team) run as finished\./g,
    t('narrative.pipelineNotes')
  );

  return md;
}
