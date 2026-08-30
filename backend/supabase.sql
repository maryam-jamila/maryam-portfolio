-- ================================================================
-- MARYAM JAMILA PORTFOLIO — SECURE SUPABASE SETUP
-- ================================================================
--
-- ADMIN USER UUID:
-- 463b7407-ab00-4124-9b67-f71a1f639c6a
--
-- Run this file first.
-- Then run backend/seed-portfolio.sql once to load the original
-- content from js/data.js into Supabase.
--
-- This script does NOT drop tables, truncate data, or delete rows.
-- DROP POLICY statements only replace old access policies.
-- ================================================================

create extension if not exists "pgcrypto";

-- ================================================================
-- 1. ADMIN USERS
-- ================================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;

grant select on table public.admin_users to authenticated;

insert into public.admin_users (user_id)
values ('463b7407-ab00-4124-9b67-f71a1f639c6a')
on conflict (user_id) do nothing;

drop policy if exists "Admins can read own admin record" on public.admin_users;
create policy "Admins can read own admin record"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

-- ================================================================
-- 2. PORTFOLIO CONTENT
-- ================================================================

create table if not exists public.portfolio_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

revoke all on table public.portfolio_content from anon, authenticated;
grant select on table public.portfolio_content to anon, authenticated;
grant insert, update on table public.portfolio_content to authenticated;

drop policy if exists "Public can read portfolio" on public.portfolio_content;
create policy "Public can read portfolio"
on public.portfolio_content
for select
to anon, authenticated
using (id = 'main');

drop policy if exists "Authenticated admin can insert portfolio" on public.portfolio_content;
drop policy if exists "Authenticated admin can update portfolio" on public.portfolio_content;
drop policy if exists "Admin can insert portfolio" on public.portfolio_content;
drop policy if exists "Admin can update portfolio" on public.portfolio_content;

create policy "Admin can insert portfolio"
on public.portfolio_content
for insert
to authenticated
with check (
  id = 'main'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admin can update portfolio"
on public.portfolio_content
for update
to authenticated
using (
  id = 'main'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  id = 'main'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

-- ================================================================
-- 3. CONTACT MESSAGES
-- ================================================================

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant select, delete on table public.contact_messages to authenticated;

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message"
on public.contact_messages
for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 120
  and length(trim(email)) between 3 and 320
  and length(trim(subject)) between 1 and 200
  and length(trim(message)) between 1 and 5000
);

drop policy if exists "Authenticated admin can read messages" on public.contact_messages;
drop policy if exists "Authenticated admin can delete messages" on public.contact_messages;
drop policy if exists "Admin can read contact messages" on public.contact_messages;
drop policy if exists "Admin can delete contact messages" on public.contact_messages;

create policy "Admin can read contact messages"
on public.contact_messages
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admin can delete contact messages"
on public.contact_messages
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

-- ================================================================
-- 4. PORTFOLIO IMAGE STORAGE
-- ================================================================

insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view portfolio images" on storage.objects;
create policy "Public can view portfolio images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-images');

drop policy if exists "Authenticated admin can upload portfolio images" on storage.objects;
drop policy if exists "Authenticated admin can update portfolio images" on storage.objects;
drop policy if exists "Authenticated admin can delete portfolio images" on storage.objects;
drop policy if exists "Admin can upload portfolio images" on storage.objects;
drop policy if exists "Admin can update portfolio images" on storage.objects;
drop policy if exists "Admin can delete portfolio images" on storage.objects;

create policy "Admin can upload portfolio images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-images'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admin can update portfolio images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-images'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'portfolio-images'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admin can delete portfolio images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-images'
  and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  )
);

-- ================================================================
-- SETUP COMPLETE
-- Next: run backend/seed-portfolio.sql once.
-- ================================================================
