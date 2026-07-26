/**
 * Production Supabase data access layer.
 * Demo Mode uses lib/demo/store.ts instead. Wire these helpers when
 * NEXT_PUBLIC_DEMO_MODE=false and Supabase env vars are set.
 */

import { createClient } from '@/lib/supabase/server';
import type { Agent, Artifact, Escalation, PlanTier } from '@/lib/supabase/types';
import { PLAN_LIMITS } from '@/lib/supabase/types';

export async function listAgentsForUser(userId: string): Promise<Agent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Agent[];
}

export async function assertAgentCapacity(userId: string, needed: number, plan: PlanTier) {
  const agents = await listAgentsForUser(userId);
  const limit = PLAN_LIMITS[plan].maxAgents;
  if (agents.length + needed > limit) {
    const err = new Error(
      `Plan limit: ${PLAN_LIMITS[plan].label} allows ${limit} agents.`
    ) as Error & { code: string; upgrade_to: string };
    err.code = 'PLAN_LIMIT';
    err.upgrade_to = plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale';
    throw err;
  }
}

export async function listPendingEscalations(userId: string): Promise<Escalation[]> {
  const supabase = await createClient();
  const { data: agents } = await supabase.from('agents').select('id').eq('user_id', userId);
  const ids = (agents ?? []).map((a) => a.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('escalations')
    .select('*')
    .in('agent_id', ids)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Escalation[];
}

export async function listArtifactsForUser(userId: string): Promise<Artifact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Artifact[];
}
