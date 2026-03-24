-- ============================================================
-- Gravon AI — Bots Tables
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (Run AFTER the initial supabase_setup.sql)
-- ============================================================

-- 1. Bots table — each user can have multiple AI bots
create table if not exists public.bots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  name          text not null default 'My Bot',
  description   text not null default '',
  ai_provider   text not null default 'openai' check (ai_provider in ('openai', 'anthropic', 'gemini')),
  ai_model      text not null default 'gpt-4o',
  system_prompt text not null default 'You are a helpful AI assistant. Keep responses concise and friendly.',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Enable RLS on bots table
alter table public.bots enable row level security;

-- 3. RLS Policies — bots
create policy "Users can view own bots"
  on public.bots for select using (auth.uid() = user_id);

create policy "Users can create own bots"
  on public.bots for insert with check (auth.uid() = user_id);

create policy "Users can update own bots"
  on public.bots for update using (auth.uid() = user_id);

create policy "Users can delete own bots"
  on public.bots for delete using (auth.uid() = user_id);

create policy "Service role can manage bots"
  on public.bots for all with check (true);

-- 4. Auto-update updated_at trigger
create trigger set_bots_updated_at
  before update on public.bots
  for each row execute function public.handle_updated_at();

-- 5. Index for performance
create index if not exists idx_bots_user_id on public.bots(user_id);
