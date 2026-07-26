/** Unified client API paths (demo + production share the same routes). */
export const api = {
  agents: '/api/agents',
  agent: (id: string) => `/api/agents/${id}`,
  escalations: '/api/escalations',
  escalation: (id: string) => `/api/escalations/${id}`,
  artifacts: '/api/artifacts',
  artifact: (id: string) => `/api/artifacts/${id}`,
  templates: '/api/templates',
  plan: '/api/plan',
  reset: '/api/reset',
  onboarded: '/api/onboarded',
  events: '/api/events',
} as const;
