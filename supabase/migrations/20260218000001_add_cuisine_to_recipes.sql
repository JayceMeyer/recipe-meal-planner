alter table public.recipes add column cuisine text[] default '{}';
create index if not exists recipes_cuisine_idx on public.recipes using gin(cuisine);
