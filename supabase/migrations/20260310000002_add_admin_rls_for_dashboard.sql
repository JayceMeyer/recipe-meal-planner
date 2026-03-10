-- Add admin/moderator SELECT policies for tables queried by the admin dashboard
-- that were missing global read access. Without these, RLS silently filtered
-- results to only the admin's own household data.

-- Admins and moderators can view all households
create policy "Admins and moderators can view all households"
  on public.households for select
  using (public.is_admin_or_moderator());

-- Admins and moderators can view all household memberships
create policy "Admins and moderators can view all household members"
  on public.household_members for select
  using (public.is_admin_or_moderator());

-- Admins and moderators can view all pantry items
create policy "Admins and moderators can view all pantry items"
  on public.pantry_items for select
  using (public.is_admin_or_moderator());

-- Admins and moderators can view all user preferences
create policy "Admins and moderators can view all user preferences"
  on public.user_preferences for select
  using (public.is_admin_or_moderator());
