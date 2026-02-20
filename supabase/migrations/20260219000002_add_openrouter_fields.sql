alter table public.user_preferences
  add column openrouter_api_key text,
  add column openrouter_model text;

alter table public.recipes
  add column source text;
