import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode } from '@/lib/config';
import { withDemoApi } from '@/lib/demo/api';
import { PLAN_LIMITS } from '@/lib/supabase/types';
import * as data from '@/lib/supabase/data';
import { launchTemplateProd } from '@/lib/runtime/prod-runner';
import { listBundledTemplates } from '@/lib/templates/catalog';

export async function GET(request: Request) {
  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const plan = store.getPlan(user.id);
      return NextResponse.json({
        templates: store.listTemplates(),
        plan,
        limits: PLAN_LIMITS[plan],
        agentCount: store.listAgents(user.id).length,
      });
    });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = await data.getPlan(user.id);
  const agents = await data.listAgentsForUser(user.id);
  return NextResponse.json({
    templates: listBundledTemplates(),
    plan,
    limits: PLAN_LIMITS[plan],
    agentCount: agents.length,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const templateId = String(body.template_id || '');
  const theme = String(body.theme || '').trim();
  if (!templateId || !theme) {
    return NextResponse.json({ error: 'template_id and theme required' }, { status: 400 });
  }

  if (isDemoMode()) {
    return withDemoApi(request, async ({ store, user }) => {
      const template = store.getTemplate(templateId);
      if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      const current = store.listAgents(user.id).length;
      const needed = template.agent_definitions.length;
      const plan = store.getPlan(user.id);
      const limit = PLAN_LIMITS[plan].maxAgents;
      if (current + needed > limit) {
        return NextResponse.json(
          {
            error: `Plan limit: ${PLAN_LIMITS[plan].label} allows ${limit} agents. This crew needs ${needed} (you have ${current}).`,
            code: 'PLAN_LIMIT',
            plan,
            limit,
            needed,
            current,
            upgrade_to: plan === 'free' ? 'starter' : plan === 'starter' ? 'pro' : 'scale',
          },
          { status: 403 }
        );
      }
      try {
        store.assertUsageBudget(user.id);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'Usage limit', code: 'USAGE_LIMIT' },
          { status: 403 }
        );
      }
      const agents = await store.launchTemplateAndRun(user.id, templateId, theme);
      store.markOnboarded(user.id);
      return NextResponse.json({ agents }, { status: 201 });
    });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const plan = await data.getPlan(user.id);
  try {
    const agents = await launchTemplateProd(user.id, templateId, theme, plan);
    return NextResponse.json({ agents }, { status: 201 });
  } catch (e) {
    const err = e as Error & { code?: string; upgrade_to?: string };
    const status = err.code === 'PLAN_LIMIT' || err.code === 'USAGE_LIMIT' ? 403 : 400;
    return NextResponse.json(
      { error: err.message, code: err.code, upgrade_to: err.upgrade_to },
      { status }
    );
  }
}
