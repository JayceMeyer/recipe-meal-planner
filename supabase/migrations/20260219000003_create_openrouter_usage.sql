create table if not exists public.openrouter_usage (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households(id) on delete cascade not null,
  request_date date not null default current_date,
  request_count integer not null default 0,
  token_count integer not null default 0,
  unique (household_id, request_date)
);

alter table public.openrouter_usage enable row level security;

create policy "Service role can manage openrouter_usage"
  on public.openrouter_usage
  for all
  using (true)
  with check (true);
