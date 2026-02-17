-- Trigger function to auto-create a household for new users
create or replace function public.handle_new_user_household()
returns trigger as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name, created_by)
  values ('My Kitchen', new.id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- Fire after a new user is created
create trigger on_auth_user_created_household
  after insert on auth.users
  for each row
  execute function public.handle_new_user_household();
