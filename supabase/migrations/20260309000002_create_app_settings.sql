-- Create app_settings table (single-row global config)
create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  ai_markup_percent numeric not null default 18,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Insert the single config row
insert into public.app_settings (id) values (1);

-- Anyone authenticated can read settings
create policy "Authenticated users can read settings"
  on public.app_settings for select
  using (auth.uid() is not null);

-- Only admins can update settings
create policy "Admins can update settings"
  on public.app_settings for update
  using (public.is_admin());
