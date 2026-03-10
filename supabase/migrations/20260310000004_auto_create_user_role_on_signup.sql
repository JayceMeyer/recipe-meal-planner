-- Auto-create a user_roles row (default 'user') on signup.
-- Without this, only manually-assigned users appear in user_roles,
-- so the admin dashboard only shows those users.

-- Update the existing signup trigger to also create a user_roles row
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

  -- Assign default 'user' role so they appear in admin dashboard
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Backfill: create user_roles rows for any existing users without one
insert into public.user_roles (user_id, role)
select id, 'user'::public.app_role
from auth.users
where id not in (select user_id from public.user_roles)
on conflict (user_id) do nothing;
