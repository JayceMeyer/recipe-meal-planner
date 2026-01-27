-- Create recipe_groups table
create table if not exists public.recipe_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster queries
create index if not exists recipe_groups_user_id_idx on public.recipe_groups(user_id);

-- Enable Row Level Security
alter table public.recipe_groups enable row level security;

-- Policy: Users can only view their own groups
create policy "Users can view own recipe groups"
  on public.recipe_groups
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own groups
create policy "Users can insert own recipe groups"
  on public.recipe_groups
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own groups
create policy "Users can update own recipe groups"
  on public.recipe_groups
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own groups
create policy "Users can delete own recipe groups"
  on public.recipe_groups
  for delete
  using (auth.uid() = user_id);

-- Create trigger for updated_at
create trigger recipe_groups_updated_at
  before update on public.recipe_groups
  for each row
  execute function public.handle_updated_at();

-- Create recipe_group_items junction table
create table if not exists public.recipe_group_items (
  group_id uuid not null references public.recipe_groups(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, recipe_id)
);

-- Create indexes for faster lookups
create index if not exists recipe_group_items_group_id_idx on public.recipe_group_items(group_id);
create index if not exists recipe_group_items_recipe_id_idx on public.recipe_group_items(recipe_id);

-- Enable Row Level Security
alter table public.recipe_group_items enable row level security;

-- Policy: Users can view items in their own groups
create policy "Users can view own recipe group items"
  on public.recipe_group_items
  for select
  using (
    exists (
      select 1 from public.recipe_groups
      where id = recipe_group_items.group_id
      and user_id = auth.uid()
    )
  );

-- Policy: Users can insert items into their own groups
create policy "Users can insert into own recipe groups"
  on public.recipe_group_items
  for insert
  with check (
    exists (
      select 1 from public.recipe_groups
      where id = recipe_group_items.group_id
      and user_id = auth.uid()
    )
  );

-- Policy: Users can delete items from their own groups
create policy "Users can delete from own recipe groups"
  on public.recipe_group_items
  for delete
  using (
    exists (
      select 1 from public.recipe_groups
      where id = recipe_group_items.group_id
      and user_id = auth.uid()
    )
  );
