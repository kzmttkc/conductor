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

function slimSnapshot(store: DemoStore, userId: string): DemoSnapshot {
  const snap = snapshotForUser(store, userId);
  snap.logs = snap.logs.slice(-12).map((l) => ({
    ...l,
    content: (l.content ?? '').slice(0, 400),
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
  snap.artifacts = snap.artifacts.slice(0, 2).map((a) => ({
    ...a,
    content_markdown: a.content_markdown.slice(0, 1800),
  }));
  snap.agents = snap.agents.map((a) => ({
    ...a,
    current_task: a.current_task?.slice(0, 240) ?? null,
    config: {
      theme: a.config?.theme,
      goal: typeof a.config?.goal === 'string' ? a.config.goal.slice(0, 200) : a.config?.goal,
      // Drop bulky system prompts from cookie — runtime can re-read from template
      escalation_conditions: a.config?.escalation_conditions,
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
  if (encoded.length > 3200) {
    encoded = encodeSnapshot(slimSnapshot(store, userId));
  }
  // Last resort: drop artifacts entirely
  if (encoded.length > 3500) {
    const snap = slimSnapshot(store, userId);
    snap.artifacts = [];
    snap.logs = snap.logs.slice(-6);
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
