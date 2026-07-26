-- Conductor Database Schema (Supabase)
-- このSQLをそのままSupabase SQL Editorで実行すること

-- agents
create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  role text not null,
  status text not null default 'idle' 
    check (status in ('idle', 'running', 'waiting_human', 'error', 'completed')),
  current_task text,
  permissions jsonb default '{}'::jsonb,
  config jsonb default '{}'::jsonb,
  template_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- agent_logs
create table agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  type text not null, -- thought / action / tool_call / result / error / escalation
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- escalations
create table escalations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'resolved', 'cancelled')),
  summary text not null,
  context jsonb default '{}'::jsonb,
  options jsonb default '[]'::jsonb,
  human_response text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- templates
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  agent_definitions jsonb not null,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table agents enable row level security;
create policy "Users can manage own agents" on agents
  for all using (auth.uid() = user_id);

alter table agent_logs enable row level security;
create policy "Users can manage own agent logs" on agent_logs
  for all using (
    exists (select 1 from agents where agents.id = agent_logs.agent_id and agents.user_id = auth.uid())
  );

alter table escalations enable row level security;
create policy "Users can manage own escalations" on escalations
  for all using (
    exists (select 1 from agents where agents.id = escalations.agent_id and agents.user_id = auth.uid())
  );

alter table templates enable row level security;
create policy "Public templates are viewable" on templates
  for select using (is_public = true or true);
