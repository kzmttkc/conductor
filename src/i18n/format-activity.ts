/** Format persisted activity / task strings for the viewer's locale. */

type TFn = (path: string, vars?: Record<string, string | number>) => string;

export function formatLogType(type: string, t: TFn): string {
  const key = `logType.${type}`;
  const out = t(key);
  return out === key ? type : out;
}

export function formatActivityContent(
  content: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
  t: TFn
): string {
  if (!content) return '';
  const key = typeof metadata?.i18nKey === 'string' ? metadata.i18nKey : null;
  if (key) {
    const params =
      metadata?.i18nParams && typeof metadata.i18nParams === 'object'
        ? (metadata.i18nParams as Record<string, string | number>)
        : {};
    const out = t(key, params);
    if (out !== key) return out;
  }

  return matchKnownLog(content, t);
}

export function formatCurrentTask(task: string | null | undefined, t: TFn): string {
  if (!task) return t('agent.idleTask');
  return matchKnownLog(task, t);
}

function restAfter(prefix: string, content: string): string | null {
  if (!content.startsWith(prefix)) return null;
  return content.slice(prefix.length);
}

function matchKnownLog(content: string, t: TFn): string {
  if (
    content === 'Stopped by commander' ||
    content === 'Stopped by user' ||
    content === 'Stopped by you'
  ) {
    return t('log.stoppedByUser');
  }
  if (content === 'Report saved.') return t('log.reportSaved');
  if (content === 'LLM report saved.') return t('log.llmReportSaved');
  if (content === 'Pipeline summary artifact saved') return t('log.pipelineSummarySaved');
  if (
    content === 'Commander requested recovery / retry' ||
    content === 'Recovery / retry requested'
  ) {
    return t('log.recoveryRequested');
  }
  if (
    content === 'Commander loosened web_search → Allow for retry' ||
    content.includes('loosened web_search')
  ) {
    return t('log.searchAllowedRetry');
  }
  if (content === 'Upstream report: ingesting prior crew deliverable') {
    return t('log.upstreamIngest');
  }
  if (content === 'Invoking LLM agent pass…') return t('log.invokingLlm');
  if (content === 'LLM unavailable') return t('log.llmUnavailable');
  if (content === 'Completed — report ready') return t('log.completedReady');
  if (content === 'Starting pass') return t('log.startingPass');

  let rest = restAfter('Awaiting decision: ', content);
  if (rest !== null) return t('log.awaitingDecision', { summary: rest });

  rest = restAfter('Cancelled by human: ', content);
  if (rest !== null) return t('log.cancelledByHuman', { response: rest });

  rest = restAfter('Human approved: ', content);
  if (rest !== null) return t('log.humanApproved', { response: rest });

  rest = restAfter('Human revised: ', content);
  if (rest !== null) return t('log.humanRevised', { response: rest });

  rest = restAfter('Pipeline gated: ', content);
  if (rest !== null) return t('log.pipelineGated', { detail: rest });

  rest = restAfter('Pipeline halted: ', content);
  if (rest !== null) return t('log.pipelineHalted', { detail: rest });

  rest = restAfter('Applying human guidance: ', content);
  if (rest !== null) return t('log.applyingGuidance', { guidance: rest });

  let m = content.match(/^Continuing pipeline after (.+)$/);
  if (m) {
    const key = `agentName.${m[1]}`;
    const localized = t(key);
    return t('log.continuingPipeline', {
      name: localized !== key ? localized : m[1],
    });
  }

  m = content.match(/^Handoff from (.+?) \((\d+) chars upstream\)$/);
  if (m) {
    const key = `agentName.${m[1]}`;
    const localized = t(key);
    return t('log.handoffFromChars', {
      name: localized !== key ? localized : m[1],
      n: m[2],
    });
  }

  m = content.match(/^Handoff from (.+)$/);
  if (m) {
    const key = `agentName.${m[1]}`;
    const localized = t(key);
    return t('log.handoffFrom', {
      name: localized !== key ? localized : m[1],
    });
  }

  if (content === 'Localizing report…' || content === 'レポートを日本語化中…') {
    return t('log.rewritingReport');
  }

  m = content.match(/^Localizing report… \((\d+) chars\)$/);
  if (m) return t('log.rewritingProgress', { n: m[1] });

  m = content.match(/^レポートを日本語化中…（(\d+) 文字）$/);
  if (m) return t('log.rewritingProgress', { n: m[1] });

  m = content.match(/^Planning work on [“"](.+)[”"]\.$/);
  if (m) return t('log.planningTheme', { theme: m[1] });

  m = content.match(/^(.+) composing final report…$/);
  if (m) return t('log.composingReport', { name: m[1] });

  m = content.match(/^Calling (.+)$/);
  if (m) return t('log.callingTool', { tool: m[1] });

  m = content.match(/^LLM tool:\s*(.+)$/);
  if (m) return t('log.llmTool', { tool: m[1] });

  m = content.match(/^Writing deliverable for (.+)$/);
  if (m) return t('log.writingDeliverable', { theme: m[1] });

  m = content.match(/^LLM pass:\s*(.+)$/);
  if (m) return t('log.llmPass', { theme: m[1] });

  m = content.match(/^Waiting for (.+) to complete\.$/);
  if (m) {
    const key = `agentName.${m[1]}`;
    const localized = t(key);
    return t('log.waitingComplete', {
      name: localized !== key ? localized : m[1],
    });
  }

  m = content.match(/^Waiting for artifact from (.+)\.$/);
  if (m) {
    const key = `agentName.${m[1]}`;
    const localized = t(key);
    return t('log.waitingArtifact', {
      name: localized !== key ? localized : m[1],
    });
  }

  m = content.match(/^Prior agent (.+) halted \((.+)\); pipeline stopped\.$/);
  if (m) {
    const key = `agentName.${m[1]}`;
    const localized = t(key);
    const statusKey = `status.${m[2]}`;
    const statusOut = t(statusKey);
    return t('log.priorHalted', {
      name: localized !== key ? localized : m[1],
      status: statusOut !== statusKey ? statusOut : m[2],
    });
  }

  if (
    content.startsWith('log.rewriteSkipped') ||
    content === 'log.rewriteSkippedLength' ||
    content === 'log.rewriteSkippedPreference' ||
    content === 'log.rewriteSkippedMismatch'
  ) {
    // Stored with i18nKey in metadata — matchKnownLog fallback if raw
    const out = t(content);
    if (out !== content) return out;
  }

  m = content.match(/^Missing prior agent (.+)$/);
  if (m) return t('log.missingPrior', { id: m[1] });

  m = content.match(/^(.+?) — Theme: (.+)$/);
  if (m) return t('log.goalTheme', { goal: m[1], theme: m[2] });

  m = content.match(/^(.+?) — テーマ: (.+)$/);
  if (m) return t('log.goalTheme', { goal: m[1], theme: m[2] });

  m = content.match(/^Tool "(.+)" is denied by (?:commander|your) permissions\.$/);
  if (m) return t('perm.denied', { tool: m[1] });

  m = content.match(
    /^Tool "(.+)" requires (?:commander|your) approval before use\.$/
  );
  if (m) return t('perm.needsApproval', { tool: m[1] });

  return content;
}
