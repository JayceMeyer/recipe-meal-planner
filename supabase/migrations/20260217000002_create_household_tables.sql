-- Create households table
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Kitchen',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.households enable row level security;

-- Create household_members table
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

alter table public.household_members enable row level security;

-- Create household_invites table
create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  email text not null,
  token text unique not null default gen_random_uuid()::text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

alter table public.household_invites enable row level security;

-- Indexes
create index if not exists household_members_household_id_idx on public.household_members(household_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_invites_household_id_idx on public.household_invites(household_id);
create index if not exists household_invites_token_idx on public.household_invites(token);

-- Triggers
create trigger households_updated_at
  before update on public.households
  for each row
  execute function public.handle_updated_at();

-- RLS policies for households
create policy "Members can view their household"
  on public.households
  for select
  using (
    id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Owner can update household"
  on public.households
  for update
  using (
    id in (select household_id from public.household_members where user_id = auth.uid() and role = 'owner')
  )
  with check (
    id in (select household_id from public.household_members where user_id = auth.uid() and role = 'owner')
  );

create policy "Owner can delete household"
  on public.households
  for delete
  using (
    id in (select household_id from public.household_members where user_id = auth.uid() and role = 'owner')
  );

create policy "Authenticated users can create households"
  on public.households
  for insert
  with check (auth.uid() is not null);

-- RLS policies for household_members
create policy "Members can view household members"
  on public.household_members
  for select
  using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Owner can add members"
  on public.household_members
  for insert
  with check (
    household_id in (select household_id from public.household_members where user_id = auth.uid() and role = 'owner')
    or user_id = auth.uid()
  );

create policy "Owner can remove members"
  on public.household_members
  for delete
  using (
    household_id in (select household_id from public.household_members where user_id = auth.uid() and role = 'owner')
  );

-- RLS policies for household_invites
create policy "Members can view household invites"
  on public.household_invites
  for select
  using (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Members can create invites"
  on public.household_invites
  for insert
  with check (
    household_id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "Owner can update invites"
  on public.household_invites
  for update
  using (
    household_id in (select household_id from public.household_members where user_id = auth.uid() and role = 'owner')
  );

create policy "Anyone can read invite by token"
  on public.household_invites
  for select
  using (true);
