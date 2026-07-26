type LogEvent =
  | 'agent.start'
  | 'agent.tool_call'
  | 'agent.escalate'
  | 'agent.resume'
  | 'agent.complete'
  | 'agent.error'
  | 'pipeline.handoff'
  | 'plan.limit_hit'
  | 'plan.limit_soft'
  | 'stripe.webhook'
  | 'rate_limit';

export function slog(event: LogEvent, payload: Record<string, unknown> = {}) {
  // Structured server log — Demo/Prod both emit for operators.
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: 'conductor',
      event,
      ...payload,
    })
  );
}
