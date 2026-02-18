-- Create user_preferences table
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cuisine_preferences text[] not null default '{}',
  dietary_restrictions text[] not null default '{}',
  setup_completed boolean not null default false,
  setup_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes
create index if not exists user_preferences_household_id_idx on public.user_preferences(household_id);
create unique index if not exists user_preferences_user_household_idx on public.user_preferences(user_id, household_id);

-- Enable Row Level Security
alter table public.user_preferences enable row level security;

-- RLS policies
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id and public.is_household_member(household_id));

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id and public.is_household_member(household_id));

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id and public.is_household_member(household_id))
  with check (auth.uid() = user_id and public.is_household_member(household_id));

create policy "Users can delete own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id and public.is_household_member(household_id));

-- Create trigger for updated_at
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row
  execute function public.handle_updated_at();
