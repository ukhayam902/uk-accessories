-- UK Accessories — Supabase auth fix v2 (run AFTER 001_init.sql)
-- Problem: 001 enables RLS on public.user_roles but creates no policy that
-- lets a signed-in user read their own row, and public.is_admin() is not
-- SECURITY DEFINER, so it cannot read user_roles through RLS either. The
-- frontend role check (and every "admin manage" policy that calls is_admin)
-- would therefore always return false, even for a real admin.
-- Fix: (1) allow each authenticated user to SELECT only their own
-- user_roles row, (2) make is_admin SECURITY DEFINER so RLS policies that
-- call it can evaluate it regardless of the caller's row-level access.
-- Apply in Supabase Dashboard > SQL Editor, in the same project as 001.
-- No keys, no secrets, no data changes beyond the policy/function below.

create policy "own role read" on public.user_roles
  for select using (user_id = auth.uid());

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = uid and role = 'admin');
$$;
