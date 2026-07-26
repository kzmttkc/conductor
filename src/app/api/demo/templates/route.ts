import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDemoStore } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/config';
import { PLAN_LIMITS } from '@/lib/supabase/types';

export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const store = getDemoStore();
  const plan = store.getPlan(user.id);
  return NextResponse.json({
    templates: store.listTemplates(),
    plan,
    limits: PLAN_LIMITS[plan],
    agentCount: store.listAgents(user.id).length,
  });
}

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo only' }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const templateId = String(body.template_id || '');
  const theme = String(body.theme || '').trim();
  if (!templateId || !theme) {
    return NextResponse.json({ error: 'template_id and theme required' }, { status: 400 });
  }

  const store = getDemoStore();
  const template = store.getTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

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

  const agents = store.launchTemplate(user.id, templateId, theme);
  store.markOnboarded(user.id);
  return NextResponse.json({ agents }, { status: 201 });
}
