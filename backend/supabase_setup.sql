-- ============================================================
-- Clavio AI — Supabase SQL Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the `users` table
-- This stores profile data. The `id` links to Supabase Auth's user id.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text not null default '',
  plan        text not null default 'free' check (plan in ('free', 'starter', 'pro', 'agency')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS)
-- This ensures users can only read/update their own row
alter table public.users enable row level security;

-- 3. RLS Policies

-- Users can read their own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile (name, etc.)
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role (backend) can insert new users during registration
create policy "Service role can insert users"
  on public.users for insert
  with check (true);

-- 4. Auto-update `updated_at` on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- 5. Create index for faster email lookups
create index if not exists idx_users_email on public.users(email);
