-- Drop existing user_id-based policies on content tables

-- Recipes
drop policy if exists "Users can view own recipes" on public.recipes;
drop policy if exists "Users can insert own recipes" on public.recipes;
drop policy if exists "Users can update own recipes" on public.recipes;
drop policy if exists "Users can delete own recipes" on public.recipes;

-- Recipe groups
drop policy if exists "Users can view own groups" on public.recipe_groups;
drop policy if exists "Users can insert own groups" on public.recipe_groups;
drop policy if exists "Users can update own groups" on public.recipe_groups;
drop policy if exists "Users can delete own groups" on public.recipe_groups;

-- Grocery lists
drop policy if exists "Users can view own lists" on public.grocery_lists;
drop policy if exists "Users can insert own lists" on public.grocery_lists;
drop policy if exists "Users can update own lists" on public.grocery_lists;
drop policy if exists "Users can delete own lists" on public.grocery_lists;

-- Pantry items
drop policy if exists "Users can view own pantry items" on public.pantry_items;
drop policy if exists "Users can insert own pantry items" on public.pantry_items;
drop policy if exists "Users can update own pantry items" on public.pantry_items;
drop policy if exists "Users can delete own pantry items" on public.pantry_items;

-- Helper: check if current user is a member of a household
create or replace function public.is_household_member(hid uuid)
returns boolean as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- New household-based policies for recipes
create policy "Household members can view recipes"
  on public.recipes for select
  using (public.is_household_member(household_id));

create policy "Household members can insert recipes"
  on public.recipes for insert
  with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "Household members can update recipes"
  on public.recipes for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members can delete recipes"
  on public.recipes for delete
  using (public.is_household_member(household_id));

-- New household-based policies for recipe_groups
create policy "Household members can view groups"
  on public.recipe_groups for select
  using (public.is_household_member(household_id));

create policy "Household members can insert groups"
  on public.recipe_groups for insert
  with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "Household members can update groups"
  on public.recipe_groups for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members can delete groups"
  on public.recipe_groups for delete
  using (public.is_household_member(household_id));

-- New household-based policies for grocery_lists
create policy "Household members can view lists"
  on public.grocery_lists for select
  using (public.is_household_member(household_id));

create policy "Household members can insert lists"
  on public.grocery_lists for insert
  with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "Household members can update lists"
  on public.grocery_lists for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members can delete lists"
  on public.grocery_lists for delete
  using (public.is_household_member(household_id));

-- New household-based policies for pantry_items
create policy "Household members can view pantry items"
  on public.pantry_items for select
  using (public.is_household_member(household_id));

create policy "Household members can insert pantry items"
  on public.pantry_items for insert
  with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "Household members can update pantry items"
  on public.pantry_items for update
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "Household members can delete pantry items"
  on public.pantry_items for delete
  using (public.is_household_member(household_id));
