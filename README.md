# Conductor

AI Agent Orchestration SaaS — a command tower for one human directing a crew of agents.

> Purpose is not smarter agents. Purpose is a human who can **trust and command** an agent team.

## Core value

1. Clear roles & permissions  
2. Realtime visibility  
3. Low-stress human-in-the-loop escalation  
4. Command & Control feel  

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style UI  
- Supabase (Auth + Postgres + Realtime) — or **Demo Mode** (zero config)  
- Inngest (resume after human response)  
- Structured / LLM agent runtime (`executeAgentPass`)  
- Stripe Checkout + webhook → `usage_stats.plan`  

## Quick start (Demo Mode)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** → Continue with Demo.

1. **Templates** → Solo Scout / Content Pipeline (Free) or upgrade for Research Crew  
2. **Dashboard** — Running → Needs You  
3. Resolve **Escalation** → agent resumes → **Results** shows the report  
4. Multi-agent templates run as a **pipeline** (Scout → Synthesizer → Verifier); each stage reads upstream artifacts  

Optional LLM: set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`.

## Public demo (share these — fixed)

| URL | Purpose |
|-----|---------|
| https://conductor-blond-xi.vercel.app/demo | One-click live demo |
| https://conductor-blond-xi.vercel.app/demo/moment | Shareable Needs You frame |
| https://conductor-blond-xi.vercel.app/og-needs-you.png | OG / social image |

```bash
npm run demo:capture   # refreshes public/demo/needs-you-storyboard.json
```

Keep `NEXT_PUBLIC_DEMO_MODE=true` on the public deploy so strangers can open `/demo` with no signup.

## Production (Supabase)

1. Create a Supabase project  
2. Run `supabase/schema.sql` in the SQL editor  
3. Copy `.env.example` → `.env.local`:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # required for Stripe webhook plan updates
```

4. Enable Magic Link + GitHub auth  
5. Enable Realtime on `agents`, `agent_logs`, `escalations`, `artifacts`  
6. Stripe: set secret + publishable keys, price IDs, webhook → `/api/stripe/webhook`  

Unified APIs (demo + prod): `/api/agents`, `/api/escalations`, `/api/artifacts`, `/api/templates`, `/api/plan`.

## Templates

| Template | Agents | Notes |
|----------|--------|-------|
| Solo Scout | 1 | Free — public demo |
| Content Pipeline | 2 | Free — Drafter → Editor handoff |
| Competitor Watch | 2 | Pipeline |
| Market Research Crew | 3 | Starter+ — Scout → Synthesizer → Verifier |

## Pricing

| Plan    | Price  | Agents | ~Runs / mo |
|---------|--------|--------|------------|
| Free    | $0     | 2      | 40         |
| Starter | $29/mo | 5      | 300        |
| Pro     | $79/mo | 15     | 1500       |
| Scale   | $149+  | 50     | 10000      |

## Master package

Product vision and reference material: `master-package/` (spec: `master-package/00_MASTER_SPEC.md`).
