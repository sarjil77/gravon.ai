-- ============================================================
-- Gravon.ai — Telegram Tenants & Usage Tables
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (Run AFTER supabase_setup.sql and supabase_bots_setup.sql)
-- ============================================================

-- 1. Tenants table — each user can have one or more OpenClaw containers
create table if not exists public.tenants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  bot_token       text not null,
  bot_username    text,                        -- @username from Telegram
  ai_model        text not null default 'anthropic/claude-sonnet-4-20250514',
  channel         text not null default 'telegram' check (channel in ('telegram', 'discord')),
  container_id    text,                        -- Docker container ID
  container_port  int,                         -- Mapped host port
  status          text not null default 'provisioning'
                  check (status in ('provisioning', 'running', 'stopped', 'error', 'suspended')),
  credits_used    int not null default 0,      -- messages consumed (free trial)
  credits_limit   int not null default 100,    -- max messages for current plan
  plan            text not null default 'free_trial'
                  check (plan in ('free_trial', 'starter', 'pro', 'agency')),
  error_message   text,                        -- last error if status = 'error'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2. Usage logs — per-tenant message tracking
create table if not exists public.usage_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  msg_count   int not null default 0,
  tokens_used int not null default 0,
  logged_at   timestamptz not null default now()
);

-- 3. Enable RLS
alter table public.tenants enable row level security;
alter table public.usage_logs enable row level security;

-- 4. RLS Policies — tenants
create policy "Users can view own tenants"
  on public.tenants for select using (auth.uid() = user_id);

create policy "Users can create own tenants"
  on public.tenants for insert with check (auth.uid() = user_id);

create policy "Users can update own tenants"
  on public.tenants for update using (auth.uid() = user_id);

create policy "Users can delete own tenants"
  on public.tenants for delete using (auth.uid() = user_id);

create policy "Service role can manage tenants"
  on public.tenants for all with check (true);

-- 5. RLS Policies — usage_logs
create policy "Users can view own usage via tenant"
  on public.usage_logs for select
  using (
    tenant_id in (
      select id from public.tenants where user_id = auth.uid()
    )
  );

create policy "Service role can manage usage_logs"
  on public.usage_logs for all with check (true);

-- 6. Auto-update updated_at (create function if missing)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_tenants_updated_at
  before update on public.tenants
  for each row execute function public.handle_updated_at();

-- 7. Index for fast lookups
create index if not exists idx_tenants_user_id on public.tenants(user_id);
create index if not exists idx_tenants_status on public.tenants(status);
create index if not exists idx_usage_logs_tenant_id on public.usage_logs(tenant_id);

-- 8. Add stripe_customer_id to users if not present
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'stripe_customer_id'
  ) then
    alter table public.users add column stripe_customer_id text;
  end if;
end $$;
