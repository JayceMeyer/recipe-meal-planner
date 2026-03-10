-- Expose user emails to admins/moderators via a security definer function.
-- auth.users is not directly queryable from the client, so we need this helper.

create or replace function public.get_user_emails(p_user_ids uuid[])
returns table (user_id uuid, email text) as $$
begin
  -- Only allow admins and moderators
  if not public.is_admin_or_moderator() then
    raise exception 'Access denied';
  end if;

  return query
    select u.id as user_id, u.email::text
    from auth.users u
    where u.id = any(p_user_ids);
end;
$$ language plpgsql security definer stable;
