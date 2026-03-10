-- Upgrade credit table SELECT policies from is_admin() to is_admin_or_moderator()
-- so moderators can also view credit data on the admin dashboard.

-- Drop the admin-only policies
drop policy "Admins can view all credits" on public.household_credits;
drop policy "Admins can view all transactions" on public.credit_transactions;

-- Re-create with moderator access
create policy "Admins and moderators can view all credits"
  on public.household_credits for select
  using (public.is_admin_or_moderator());

create policy "Admins and moderators can view all transactions"
  on public.credit_transactions for select
  using (public.is_admin_or_moderator());
