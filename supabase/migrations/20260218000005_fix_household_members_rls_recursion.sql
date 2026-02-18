-- Fix infinite recursion in household_members RLS policies.
-- The existing policies use self-referential subqueries on household_members
-- which causes PostgreSQL to infinitely recurse evaluating RLS.
-- Fix: use auth.uid() directly and the SECURITY DEFINER function
-- is_household_member() which bypasses RLS on the inner query.

-- Drop the self-referential policies
drop policy if exists "Members can view household members" on public.household_members;
drop policy if exists "Owner can add members" on public.household_members;
drop policy if exists "Owner can remove members" on public.household_members;

-- SELECT: users can see their own rows + all members of their households
create policy "Members can view household members"
  on public.household_members
  for select
  using (
    auth.uid() = user_id
    or public.is_household_member(household_id)
  );

-- INSERT: users can add themselves (invite flow) or existing members can add
create policy "Members can add to household"
  on public.household_members
  for insert
  with check (
    auth.uid() = user_id
    or public.is_household_member(household_id)
  );

-- DELETE: household members can remove members
create policy "Members can remove from household"
  on public.household_members
  for delete
  using (public.is_household_member(household_id));
