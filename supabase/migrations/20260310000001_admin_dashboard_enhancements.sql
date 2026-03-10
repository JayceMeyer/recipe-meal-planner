-- Admin Dashboard Enhancements
-- Adds signup bonus setting, modifies new-household trigger, and adds credit transfer function

-- 1. Add signup_bonus_credits to app_settings
alter table public.app_settings
  add column signup_bonus_credits integer not null default 100;

-- 2. Modify handle_new_household_credits to grant signup bonus from app_settings
create or replace function public.handle_new_household_credits()
returns trigger as $$
declare
  v_bonus integer;
begin
  select signup_bonus_credits into v_bonus
  from public.app_settings
  where id = 1;

  if v_bonus is null or v_bonus <= 0 then
    insert into public.household_credits (household_id, balance)
    values (new.id, 0);
  else
    insert into public.household_credits (household_id, balance)
    values (new.id, v_bonus);

    insert into public.credit_transactions (household_id, type, amount, balance_after, description)
    values (new.id, 'bonus', v_bonus, v_bonus, 'Signup bonus');
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 3. Add p_type parameter to add_credits for admin bonus/refund support
create or replace function public.add_credits(
  p_household_id uuid,
  p_amount integer,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_type public.credit_transaction_type default 'purchase'
)
returns integer as $$
declare
  v_new_balance integer;
begin
  insert into public.household_credits (household_id, balance, updated_at)
  values (p_household_id, p_amount, now())
  on conflict (household_id)
  do update set balance = household_credits.balance + p_amount,
               updated_at = now()
  returning balance into v_new_balance;

  insert into public.credit_transactions (household_id, type, amount, balance_after, description, metadata)
  values (p_household_id, p_type, p_amount, v_new_balance, p_description, p_metadata);

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- 4. Add p_type parameter to deduct_credits for admin refund support
create or replace function public.deduct_credits(
  p_household_id uuid,
  p_amount integer,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_type public.credit_transaction_type default 'usage'
)
returns integer as $$
declare
  v_new_balance integer;
begin
  update public.household_credits
  set balance = balance - p_amount,
      updated_at = now()
  where household_id = p_household_id
    and balance >= p_amount
  returning balance into v_new_balance;

  if v_new_balance is null then
    return -1;
  end if;

  insert into public.credit_transactions (household_id, type, amount, balance_after, description, metadata)
  values (p_household_id, p_type, -p_amount, v_new_balance, p_description, p_metadata);

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- 5. Create transfer_household_credits function
create or replace function public.transfer_household_credits(
  p_source_household uuid,
  p_target_household uuid
)
returns integer as $$
declare
  v_source_balance integer;
  v_new_target_balance integer;
begin
  select balance into v_source_balance
  from public.household_credits
  where household_id = p_source_household
  for update;

  if v_source_balance is null or v_source_balance <= 0 then
    return 0;
  end if;

  update public.household_credits
  set balance = 0, updated_at = now()
  where household_id = p_source_household;

  insert into public.household_credits (household_id, balance, updated_at)
  values (p_target_household, v_source_balance, now())
  on conflict (household_id)
  do update set balance = household_credits.balance + v_source_balance,
               updated_at = now()
  returning balance into v_new_target_balance;

  insert into public.credit_transactions (household_id, type, amount, balance_after, description)
  values (p_source_household, 'usage', -v_source_balance, 0,
          'Credits transferred to new household');

  insert into public.credit_transactions (household_id, type, amount, balance_after, description)
  values (p_target_household, 'bonus', v_source_balance, v_new_target_balance,
          'Credits transferred from previous household');

  return v_source_balance;
end;
$$ language plpgsql security definer;
