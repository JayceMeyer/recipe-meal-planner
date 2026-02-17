-- Create pantry_items table
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_name text not null,
  quantity text,
  unit text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster queries
create index if not exists pantry_items_user_id_idx on public.pantry_items(user_id);

-- Create index on category for grouping
create index if not exists pantry_items_category_idx on public.pantry_items(category);

-- Enable Row Level Security
alter table public.pantry_items enable row level security;

-- Policy: Users can only view their own pantry items
create policy "Users can view own pantry items"
  on public.pantry_items
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own pantry items
create policy "Users can insert own pantry items"
  on public.pantry_items
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own pantry items
create policy "Users can update own pantry items"
  on public.pantry_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own pantry items
create policy "Users can delete own pantry items"
  on public.pantry_items
  for delete
  using (auth.uid() = user_id);

-- Create trigger for updated_at
create trigger pantry_items_updated_at
  before update on public.pantry_items
  for each row
  execute function public.handle_updated_at();
