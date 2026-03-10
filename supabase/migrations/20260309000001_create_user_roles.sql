-- Create user_roles table for global role-based access control
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_user_id_unique unique (user_id)
);

alter table public.user_roles enable row level security;

-- Function to get current user's app role (defaults to 'user' if no row)
create or replace function public.get_user_role()
returns public.app_role as $$
  select coalesce(
    (select role from public.user_roles where user_id = auth.uid()),
    'user'::public.app_role
  );
$$ language sql security definer stable;

-- Helper to check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select public.get_user_role() = 'admin';
$$ language sql security definer stable;

-- Helper to check if current user is admin or moderator
create or replace function public.is_admin_or_moderator()
returns boolean as $$
  select public.get_user_role() in ('admin', 'moderator');
$$ language sql security definer stable;

-- RLS policies for user_roles
create policy "Users can read own role"
  on public.user_roles for select
  using (user_id = auth.uid());

create policy "Admins can read all roles"
  on public.user_roles for select
  using (public.is_admin());

create policy "Admins can insert roles"
  on public.user_roles for insert
  with check (public.is_admin());

create policy "Admins can update roles"
  on public.user_roles for update
  using (public.is_admin());

create policy "Admins can delete roles"
  on public.user_roles for delete
  using (public.is_admin());

create policy "Moderators can read all roles"
  on public.user_roles for select
  using (public.get_user_role() = 'moderator');

-- Admin/moderator read access to recipes (all rows for dashboard queries)
create policy "Admins and moderators can view all recipes"
  on public.recipes for select
  using (public.is_admin_or_moderator());

-- Admin/moderator read access to meal_plans (all rows for dashboard queries)
create policy "Admins and moderators can view all meal plans"
  on public.meal_plans for select
  using (public.is_admin_or_moderator());
