import { deflateSync, inflateSync } from 'zlib';
import type { NextResponse } from 'next/server';
import type {
  Agent,
  AgentLog,
  Artifact,
  Escalation,
  PlanTier,
  UsageStats,
} from '@/lib/supabase/types';
import { DemoStore, getDemoStore } from '@/lib/demo/store';

export const DEMO_STATE_COOKIE = 'conductor_demo_state';

export type DemoSnapshot = {
  v: 1;
  userId: string;
  plan: PlanTier;
  onboarded: boolean;
  agents: Agent[];
  logs: AgentLog[];
  escalations: Escalation[];
  artifacts: Artifact[];
  usage: UsageStats;
};

function cookiePersistenceEnabled() {
  return process.env.VERCEL === '1' || process.env.DEMO_COOKIE_STORE === 'true';
}

export function encodeSnapshot(snapshot: DemoSnapshot): string {
  const json = JSON.stringify(snapshot);
  return deflateSync(Buffer.from(json, 'utf8')).toString('base64url');
}

export function decodeSnapshot(raw: string | undefined | null): DemoSnapshot | null {
  if (!raw) return null;
  try {
    const json = inflateSync(Buffer.from(raw, 'base64url')).toString('utf8');
    const data = JSON.parse(json) as DemoSnapshot;
    if (data?.v !== 1 || !data.userId) return null;
    return data;
  } catch {
    return null;
  }
}

export function snapshotForUser(store: DemoStore, userId: string): DemoSnapshot {
  const agentIds = new Set(store.listAgents(userId).map((a) => a.id));
  return {
    v: 1,
    userId,
    plan: store.getPlan(userId),
    onboarded: store.isOnboarded(userId),
    agents: store.listAgents(userId),
    logs: store.logs.filter((l) => agentIds.has(l.agent_id)),
    escalations: store.escalations.filter((e) => agentIds.has(e.agent_id)),
    artifacts: store.listArtifacts(userId),
    usage: store.usage,
  };
}

export function hydrateStore(snapshot: DemoSnapshot | null): DemoStore {
  if (!cookiePersistenceEnabled()) {
    return getDemoStore();
  }
  const store = new DemoStore();
  if (!snapshot) return store;

  store.agents = snapshot.agents ?? [];
  store.logs = snapshot.logs ?? [];
  store.escalations = snapshot.escalations ?? [];
  store.artifacts = snapshot.artifacts ?? [];
  store.usage = snapshot.usage ?? store.usage;
  store.setPlan(snapshot.userId, snapshot.plan ?? 'free');
  if (snapshot.onboarded) store.markOnboarded(snapshot.userId);
  return store;
}

export function readSnapshotFromCookieHeader(cookieHeader: string | null): DemoSnapshot | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${DEMO_STATE_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(DEMO_STATE_COOKIE.length + 1));
  return decodeSnapshot(value);
}

function slimSnapshot(store: DemoStore, userId: string, artifactChars = 900): DemoSnapshot {
  const snap = snapshotForUser(store, userId);
  snap.logs = snap.logs.slice(-8).map((l) => ({
    ...l,
    content: (l.content ?? '').slice(0, 280),
    metadata: {},
  }));
  snap.escalations = snap.escalations.slice(0, 4).map((e) => ({
    ...e,
    context: {
      theme: typeof e.context?.theme === 'string' ? e.context.theme : undefined,
      tool: typeof e.context?.tool === 'string' ? e.context.tool : undefined,
      reason: typeof e.context?.reason === 'string' ? e.context.reason : undefined,
    },
  }));
  // Keep one stub per agent so Results / pipeline handoff survive cookies
  const byAgent = new Map<string, (typeof snap.artifacts)[number]>();
  for (const a of snap.artifacts) {
    if (!byAgent.has(a.agent_id)) byAgent.set(a.agent_id, a);
  }
  snap.artifacts = [...byAgent.values()].slice(0, 4).map((a) => ({
    ...a,
    content_markdown: a.content_markdown.slice(0, artifactChars),
  }));
  snap.agents = snap.agents.map((a) => ({
    ...a,
    current_task: a.current_task?.slice(0, 240) ?? null,
    config: {
      theme: a.config?.theme,
      goal: typeof a.config?.goal === 'string' ? a.config.goal.slice(0, 160) : a.config?.goal,
      escalation_conditions: a.config?.escalation_conditions,
      // Preserve pipeline wiring (critical for multi-agent handoff)
      pipeline: a.config?.pipeline,
      pipeline_index: a.config?.pipeline_index,
      pipeline_ids: a.config?.pipeline_ids,
      pipeline_next: a.config?.pipeline_next,
      latest_artifact_id: a.config?.latest_artifact_id,
      // Truncate bulky upstream text in cookie
      upstream_reports:
        typeof a.config?.upstream_reports === 'string'
          ? a.config.upstream_reports.slice(0, 1200)
          : a.config?.upstream_reports,
    },
  }));
  return snap;
}

export function persistStoreToResponse(
  res: NextResponse,
  store: DemoStore,
  userId: string
) {
  if (!cookiePersistenceEnabled()) return;
  let encoded = encodeSnapshot(snapshotForUser(store, userId));
  if (encoded.length > 3000) {
    encoded = encodeSnapshot(slimSnapshot(store, userId, 700));
  }
  if (encoded.length > 3500) {
    encoded = encodeSnapshot(slimSnapshot(store, userId, 320));
  }
  if (encoded.length > 3800) {
    const snap = slimSnapshot(store, userId, 160);
    snap.logs = snap.logs.slice(-4);
    encoded = encodeSnapshot(snap);
  }
  res.cookies.set(DEMO_STATE_COOKIE, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.VERCEL === '1',
  });
}

export function getStoreForRequest(request: Request): DemoStore {
  if (!cookiePersistenceEnabled()) return getDemoStore();
  const snapshot = readSnapshotFromCookieHeader(request.headers.get('cookie'));
  return hydrateStore(snapshot);
}

/** Server Components / Route Handlers using next/headers cookies() */
export async function getStoreFromCookies(): Promise<DemoStore> {
  if (!cookiePersistenceEnabled()) return getDemoStore();
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  const raw = jar.get(DEMO_STATE_COOKIE)?.value;
  return hydrateStore(decodeSnapshot(raw));
}
