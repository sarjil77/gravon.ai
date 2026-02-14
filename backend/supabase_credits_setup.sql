-- ============================================================
-- Gravon.ai — Credits & Transactions Tables
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (Run AFTER supabase_tenants_setup.sql)
-- ============================================================

-- 1. Credit balance table — one row per user
create table if not exists public.credit_balances (
  user_id     uuid primary key references public.users(id) on delete cascade,
  balance     int not null default 50,          -- current credit balance (starts with 50 free)
  total_purchased int not null default 0,       -- lifetime credits purchased
  total_used  int not null default 0,           -- lifetime credits consumed
  updated_at  timestamptz not null default now()
);

-- 2. Credit transactions — audit trail for every credit change
create table if not exists public.credit_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  amount          int not null,                 -- positive = added, negative = deducted
  balance_after   int not null,                 -- balance after this transaction
  type            text not null check (type in (
    'free_signup',      -- initial free credits on registration
    'purchase',         -- bought via Stripe
    'usage',            -- deducted per AI message
    'refund',           -- refund from Stripe
    'admin_grant'       -- manual admin adjustment
  )),
  description     text,                         -- human-readable description
  stripe_session_id text,                       -- Stripe checkout session (for purchases)
  tenant_id       uuid references public.tenants(id) on delete set null,  -- which bot used credits
  created_at      timestamptz not null default now()
);

-- 3. Stripe checkout sessions — track payment lifecycle
create table if not exists public.stripe_sessions (
  id                  text primary key,         -- Stripe checkout session ID
  user_id             uuid not null references public.users(id) on delete cascade,
  pack_id             text not null,            -- 'starter', 'pro', 'business'
  credits             int not null,             -- credits to add on success
  amount_cents        int not null,             -- price in cents ($9 = 900)
  currency            text not null default 'usd',
  status              text not null default 'pending'
                      check (status in ('pending', 'completed', 'expired', 'failed')),
  stripe_payment_intent text,                   -- Stripe payment intent ID
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- 4. Enable RLS
alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.stripe_sessions enable row level security;

-- 5. RLS Policies — credit_balances
create policy "Users can view own balance"
  on public.credit_balances for select
  using (auth.uid() = user_id);

create policy "Service role can manage credit_balances"
  on public.credit_balances for all
  using (true) with check (true);

-- 6. RLS Policies — credit_transactions
create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Service role can manage credit_transactions"
  on public.credit_transactions for all
  using (true) with check (true);

-- 7. RLS Policies — stripe_sessions
create policy "Users can view own sessions"
  on public.stripe_sessions for select
  using (auth.uid() = user_id);

create policy "Service role can manage stripe_sessions"
  on public.stripe_sessions for all
  using (true) with check (true);

-- 8. Auto-update updated_at on credit_balances
create trigger set_credit_balances_updated_at
  before update on public.credit_balances
  for each row execute function public.handle_updated_at();

-- 9. Indexes
create index if not exists idx_credit_transactions_user_id
  on public.credit_transactions(user_id);
create index if not exists idx_credit_transactions_created_at
  on public.credit_transactions(created_at desc);
create index if not exists idx_stripe_sessions_user_id
  on public.stripe_sessions(user_id);

-- 10. Function to auto-create credit balance on user registration
--     Inserts 50 free credits + a transaction record
create or replace function public.handle_new_user_credits()
returns trigger as $$
begin
  -- Create balance row with 50 free credits
  insert into public.credit_balances (user_id, balance, total_purchased, total_used)
  values (new.id, 50, 0, 0);

  -- Log the free signup transaction
  insert into public.credit_transactions (user_id, amount, balance_after, type, description)
  values (new.id, 50, 50, 'free_signup', 'Welcome bonus: 50 free credits');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger: fire after a row is inserted into public.users
drop trigger if exists on_user_created_credits on public.users;
create trigger on_user_created_credits
  after insert on public.users
  for each row execute function public.handle_new_user_credits();
