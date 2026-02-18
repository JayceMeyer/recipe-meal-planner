-- Create meal_plans table
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes
create index if not exists meal_plans_household_id_idx on public.meal_plans(household_id);
create index if not exists meal_plans_week_start_idx on public.meal_plans(week_start);

-- Unique constraint: one plan per household per week
create unique index if not exists meal_plans_household_week_idx on public.meal_plans(household_id, week_start);

-- Enable Row Level Security
alter table public.meal_plans enable row level security;

-- Household-based RLS policies
create policy "Household members can view meal plans"
  on public.meal_plans for select
  using (public.is_household_member(household_id));

create policy "Household members can insert meal plans"
  on public.meal_plans for insert
  with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "Household members can update meal plans"
  on public.meal_plans for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members can delete meal plans"
  on public.meal_plans for delete
  using (public.is_household_member(household_id));

-- Create trigger for updated_at
create trigger meal_plans_updated_at
  before update on public.meal_plans
  for each row
  execute function public.handle_updated_at();

-- Create meal_plan_entries table
create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  notes text,
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists meal_plan_entries_plan_id_idx on public.meal_plan_entries(plan_id);
create index if not exists meal_plan_entries_date_idx on public.meal_plan_entries(date);
create index if not exists meal_plan_entries_recipe_id_idx on public.meal_plan_entries(recipe_id);

-- Enable Row Level Security
alter table public.meal_plan_entries enable row level security;

-- RLS policies via parent meal_plans table
create policy "Household members can view meal plan entries"
  on public.meal_plan_entries for select
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.plan_id
      and public.is_household_member(household_id)
    )
  );

create policy "Household members can insert meal plan entries"
  on public.meal_plan_entries for insert
  with check (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.plan_id
      and public.is_household_member(household_id)
    )
  );

create policy "Household members can update meal plan entries"
  on public.meal_plan_entries for update
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.plan_id
      and public.is_household_member(household_id)
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.plan_id
      and public.is_household_member(household_id)
    )
  );

create policy "Household members can delete meal plan entries"
  on public.meal_plan_entries for delete
  using (
    exists (
      select 1 from public.meal_plans
      where id = meal_plan_entries.plan_id
      and public.is_household_member(household_id)
    )
  );
