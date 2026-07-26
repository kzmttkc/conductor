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
- Thin LangGraph-style runtime wrapper  
- Stripe plan stubs  

## Quick start (Demo Mode)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** → Continue with Demo.

Then:

1. **Templates** → Launch **Solo Scout** (Free) or upgrade for **Market Research Crew**  
2. Watch the **Dashboard** (Running → Needs You) — red command banner appears  
3. Resolve the **Escalation** → agent resumes → **Results** shows the report  

Optional real LLM: set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`.  
Without keys, agents still run structured research + live web search and produce reports.

## Public demo (share this)

| URL | Purpose |
|-----|---------|
| `/demo` | One-click demo — no signup, launches Solo Scout |
| `/demo/moment` | Shareable Needs You frame (OG-ready) |
| `/og-needs-you.svg` | Social preview image |

```bash
npm run demo:capture   # writes public/demo/needs-you-storyboard.json
```

Deploy with Demo Mode on (`NEXT_PUBLIC_DEMO_MODE=true`) so strangers can open `/demo` immediately.  

## Production (Supabase)

1. Create a Supabase project  
2. Run `supabase/schema.sql` in the SQL editor  
3. Copy `.env.example` → `.env.local` and set:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Enable Magic Link + GitHub auth providers  
5. Enable Realtime on `agents`, `agent_logs`, `escalations`  

## Master package

Product vision, schema, types, prompts, and reference code live under `master-package/` (from the Conductor master package zip). Spec authority: `master-package/00_MASTER_SPEC.md`.

## Pricing

| Plan    | Price  | Agents |
|---------|--------|--------|
| Free    | $0     | 2      |
| Starter | $29/mo | 5      |
| Pro     | $79/mo | 15     |
| Scale   | $149+  | 50     |

## Implementation order

Phase 0 Setup → Phase 1 Dashboard → **Phase 2 Escalation (priority)** → Runtime → Resume → Research Crew → Permissions → Stripe/Onboarding.
