-- ============================================================
-- Gravon.ai — Gmail Connections Table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (Run AFTER supabase_setup.sql)
-- ============================================================

-- 1. Gmail connections — stores OAuth tokens & preferences per user
create table if not exists public.gmail_connections (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  tenant_id         uuid references public.tenants(id) on delete set null,
  email_address     text not null,                    -- user's Gmail address
  refresh_token     text not null,                    -- Google OAuth refresh token
  access_token      text,                             -- short-lived, auto-refreshed
  token_expires_at  timestamptz,                      -- when access_token expires
  filters           jsonb not null default '{}'::jsonb,
    -- Example: {"from": ["boss@company.com"], "subject_contains": ["urgent"], "has_attachment": false}
  history_id        text,                             -- Gmail history ID for incremental sync
  watch_expiry      timestamptz,                      -- when gmail.watch() expires (max 7 days)
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. Gmail message log — track processed emails to avoid duplicates
create table if not exists public.gmail_processed_messages (
  id                uuid primary key default gen_random_uuid(),
  connection_id     uuid not null references public.gmail_connections(id) on delete cascade,
  gmail_message_id  text not null,                    -- Gmail's message ID
  from_address      text,
  subject           text,
  action_taken      text default 'notified',          -- 'notified', 'auto_replied', 'skipped'
  processed_at      timestamptz not null default now()
);

-- Prevent duplicate processing
create unique index if not exists idx_gmail_processed_unique
  on public.gmail_processed_messages (connection_id, gmail_message_id);

-- 3. Enable RLS
alter table public.gmail_connections enable row level security;
alter table public.gmail_processed_messages enable row level security;

-- 4. RLS Policies — gmail_connections
create policy "Users can view own gmail connections"
  on public.gmail_connections for select using (auth.uid() = user_id);

create policy "Users can create own gmail connections"
  on public.gmail_connections for insert with check (auth.uid() = user_id);

create policy "Users can update own gmail connections"
  on public.gmail_connections for update using (auth.uid() = user_id);

create policy "Users can delete own gmail connections"
  on public.gmail_connections for delete using (auth.uid() = user_id);

-- 5. RLS Policies — gmail_processed_messages (via connection ownership)
create policy "Users can view own gmail processed messages"
  on public.gmail_processed_messages for select
  using (
    connection_id in (
      select id from public.gmail_connections where user_id = auth.uid()
    )
  );

-- 6. Service-role bypass (backend needs full access for push handler)
-- The supabase_admin client already bypasses RLS via service_role key

-- 7. Auto-update updated_at on gmail_connections
create trigger set_gmail_connections_updated_at
  before update on public.gmail_connections
  for each row execute function public.handle_updated_at();

-- 8. Index for fast lookups by email (push handler needs this)
create index if not exists idx_gmail_connections_email
  on public.gmail_connections (email_address);

create index if not exists idx_gmail_connections_user
  on public.gmail_connections (user_id);
