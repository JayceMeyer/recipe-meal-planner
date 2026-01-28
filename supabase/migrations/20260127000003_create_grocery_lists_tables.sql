-- Create grocery_lists table
create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster queries
create index if not exists grocery_lists_user_id_idx on public.grocery_lists(user_id);

-- Create index on created_at for sorting
create index if not exists grocery_lists_created_at_idx on public.grocery_lists(created_at desc);

-- Enable Row Level Security
alter table public.grocery_lists enable row level security;

-- Policy: Users can only view their own grocery lists
create policy "Users can view own grocery lists"
  on public.grocery_lists
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own grocery lists
create policy "Users can insert own grocery lists"
  on public.grocery_lists
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only update their own grocery lists
create policy "Users can update own grocery lists"
  on public.grocery_lists
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own grocery lists
create policy "Users can delete own grocery lists"
  on public.grocery_lists
  for delete
  using (auth.uid() = user_id);

-- Create trigger for updated_at
create trigger grocery_lists_updated_at
  before update on public.grocery_lists
  for each row
  execute function public.handle_updated_at();

-- Create grocery_items table
create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.grocery_lists(id) on delete cascade,
  ingredient_name text not null,
  quantity text,
  unit text,
  checked boolean not null default false,
  source_recipe_id uuid references public.recipes(id) on delete set null,
  category text,
  created_at timestamptz not null default now()
);

-- Create index on list_id for faster queries (primary performance index per task spec)
create index if not exists grocery_items_list_id_idx on public.grocery_items(list_id);

-- Create index on source_recipe_id for recipe lookups
create index if not exists grocery_items_source_recipe_id_idx on public.grocery_items(source_recipe_id);

-- Create index on category for grouping items
create index if not exists grocery_items_category_idx on public.grocery_items(category);

-- Enable Row Level Security
alter table public.grocery_items enable row level security;

-- Policy: Users can view items in their own grocery lists
create policy "Users can view own grocery items"
  on public.grocery_items
  for select
  using (
    exists (
      select 1 from public.grocery_lists
      where id = grocery_items.list_id
      and user_id = auth.uid()
    )
  );

-- Policy: Users can insert items into their own grocery lists
create policy "Users can insert into own grocery lists"
  on public.grocery_items
  for insert
  with check (
    exists (
      select 1 from public.grocery_lists
      where id = grocery_items.list_id
      and user_id = auth.uid()
    )
  );

-- Policy: Users can update items in their own grocery lists
create policy "Users can update own grocery items"
  on public.grocery_items
  for update
  using (
    exists (
      select 1 from public.grocery_lists
      where id = grocery_items.list_id
      and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.grocery_lists
      where id = grocery_items.list_id
      and user_id = auth.uid()
    )
  );

-- Policy: Users can delete items from their own grocery lists
create policy "Users can delete from own grocery lists"
  on public.grocery_items
  for delete
  using (
    exists (
      select 1 from public.grocery_lists
      where id = grocery_items.list_id
      and user_id = auth.uid()
    )
  );
