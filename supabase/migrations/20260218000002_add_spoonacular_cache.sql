create table if not exists public.spoonacular_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  response jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

create index if not exists spoonacular_cache_key_idx on public.spoonacular_cache(cache_key);
create index if not exists spoonacular_cache_expires_idx on public.spoonacular_cache(expires_at);

create table if not exists public.spoonacular_usage (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade,
  request_date date not null default current_date,
  request_count integer not null default 1,
  unique(household_id, request_date)
);

alter table public.spoonacular_cache enable row level security;
alter table public.spoonacular_usage enable row level security;

create policy "Edge functions can manage cache"
  on public.spoonacular_cache for all
  using (true) with check (true);

create policy "Edge functions can manage usage"
  on public.spoonacular_usage for all
  using (true) with check (true);
