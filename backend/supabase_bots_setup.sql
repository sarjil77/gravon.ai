-- ============================================================
-- Clavio AI — Bots & WhatsApp Sessions Tables
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
  system_prompt text not null default 'You are a helpful AI assistant for WhatsApp. Keep responses concise and friendly.',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. WhatsApp sessions table — tracks connection state per user
create table if not exists public.whatsapp_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique not null references public.users(id) on delete cascade,
  phone_number  text,
  connected     boolean not null default false,
  last_seen     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. Chat messages log — stores conversation history
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  bot_id        uuid references public.bots(id) on delete set null,
  from_phone    text not null,
  from_name     text not null default '',
  message_text  text not null,
  reply_text    text,
  created_at    timestamptz not null default now()
);

-- 4. Enable RLS on all new tables
alter table public.bots enable row level security;
alter table public.whatsapp_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- 5. RLS Policies — bots
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

-- 6. RLS Policies — whatsapp_sessions
create policy "Users can view own WA session"
  on public.whatsapp_sessions for select using (auth.uid() = user_id);

create policy "Service role can manage WA sessions"
  on public.whatsapp_sessions for all with check (true);

-- 7. RLS Policies — chat_messages
create policy "Users can view own messages"
  on public.chat_messages for select using (auth.uid() = user_id);

create policy "Service role can manage messages"
  on public.chat_messages for all with check (true);

-- 8. Auto-update updated_at triggers
create trigger set_bots_updated_at
  before update on public.bots
  for each row execute function public.handle_updated_at();

create trigger set_wa_sessions_updated_at
  before update on public.whatsapp_sessions
  for each row execute function public.handle_updated_at();

-- 9. Indexes for performance
create index if not exists idx_bots_user_id on public.bots(user_id);
create index if not exists idx_wa_sessions_user_id on public.whatsapp_sessions(user_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_from_phone on public.chat_messages(from_phone);
