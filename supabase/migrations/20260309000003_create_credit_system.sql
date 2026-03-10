-- Credit system: household credits, transactions, and Stripe customers

-- Enum for transaction types
create type public.credit_transaction_type as enum ('purchase', 'usage', 'bonus', 'refund');

-- Household credit balances (one row per household)
create table public.household_credits (
  household_id uuid primary key references public.households(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.household_credits enable row level security;

-- Household members can read their own credits
create policy "Household members can view credits"
  on public.household_credits for select
  using (public.is_household_member(household_id));

-- Admins can view all credits
create policy "Admins can view all credits"
  on public.household_credits for select
  using (public.is_admin());

-- Credit transaction history
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  type public.credit_transaction_type not null,
  amount integer not null,
  balance_after integer not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index credit_transactions_household_id_idx
  on public.credit_transactions (household_id, created_at desc);

alter table public.credit_transactions enable row level security;

-- Household members can read their own transactions
create policy "Household members can view transactions"
  on public.credit_transactions for select
  using (public.is_household_member(household_id));

-- Admins can view all transactions
create policy "Admins can view all transactions"
  on public.credit_transactions for select
  using (public.is_admin());

-- Stripe customer mapping (one per household)
create table public.stripe_customers (
  household_id uuid primary key references public.households(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.stripe_customers enable row level security;

-- Household members can read their Stripe customer record
create policy "Household members can view stripe customer"
  on public.stripe_customers for select
  using (public.is_household_member(household_id));

-- Atomic credit deduction (prevents race conditions)
create or replace function public.deduct_credits(
  p_household_id uuid,
  p_amount integer,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
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
  values (p_household_id, 'usage', -p_amount, v_new_balance, p_description, p_metadata);

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- Atomic credit addition (upsert for safety)
create or replace function public.add_credits(
  p_household_id uuid,
  p_amount integer,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
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
  values (p_household_id, 'purchase', p_amount, v_new_balance, p_description, p_metadata);

  return v_new_balance;
end;
$$ language plpgsql security definer;

-- Auto-provision: create household_credits row when a new household is created
create or replace function public.handle_new_household_credits()
returns trigger as $$
begin
  insert into public.household_credits (household_id, balance)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_household_created_credits
  after insert on public.households
  for each row
  execute function public.handle_new_household_credits();

-- Backfill: create household_credits for any existing households
insert into public.household_credits (household_id, balance)
select id, 0 from public.households
on conflict (household_id) do nothing;
