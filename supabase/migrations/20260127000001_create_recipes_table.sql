-- Create recipes table
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  source_url text,
  servings integer,
  prep_time integer,
  cook_time integer,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  notes text,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster queries
create index if not exists recipes_user_id_idx on public.recipes(user_id);

-- Create index on created_at for sorting
create index if not exists recipes_created_at_idx on public.recipes(created_at desc);

-- Enable Row Level Security
alter table public.recipes enable row level security;

-- Policy: Users can only view their own recipes
create policy "Users can view own recipes"
  on public.recipes
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own recipes
create policy "Users can insert own recipes"
  on public.recipes
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own recipes
create policy "Users can update own recipes"
  on public.recipes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own recipes
create policy "Users can delete own recipes"
  on public.recipes
  for delete
  using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger recipes_updated_at
  before update on public.recipes
  for each row
  execute function public.handle_updated_at();
