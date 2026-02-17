-- Add household_id to content tables (nullable first for migration)
alter table public.recipes add column household_id uuid references public.households(id) on delete cascade;
alter table public.recipe_groups add column household_id uuid references public.households(id) on delete cascade;
alter table public.grocery_lists add column household_id uuid references public.households(id) on delete cascade;
alter table public.pantry_items add column household_id uuid references public.households(id) on delete cascade;

-- For each existing user: create a household and add as owner
do $$
declare
  r record;
  new_household_id uuid;
begin
  for r in select distinct id from auth.users loop
    insert into public.households (name, created_by)
    values ('My Kitchen', r.id)
    returning id into new_household_id;

    insert into public.household_members (household_id, user_id, role)
    values (new_household_id, r.id, 'owner');

    update public.recipes set household_id = new_household_id where user_id = r.id;
    update public.recipe_groups set household_id = new_household_id where user_id = r.id;
    update public.grocery_lists set household_id = new_household_id where user_id = r.id;
    update public.pantry_items set household_id = new_household_id where user_id = r.id;
  end loop;
end $$;

-- Make household_id NOT NULL now that data is migrated
alter table public.recipes alter column household_id set not null;
alter table public.recipe_groups alter column household_id set not null;
alter table public.grocery_lists alter column household_id set not null;
alter table public.pantry_items alter column household_id set not null;

-- Create indexes
create index if not exists recipes_household_id_idx on public.recipes(household_id);
create index if not exists recipe_groups_household_id_idx on public.recipe_groups(household_id);
create index if not exists grocery_lists_household_id_idx on public.grocery_lists(household_id);
create index if not exists pantry_items_household_id_idx on public.pantry_items(household_id);
