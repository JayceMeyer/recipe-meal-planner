-- Create storage bucket for recipe images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- RLS policies for recipe-images bucket
-- Path structure: {household_id}/{recipe_id}.webp

-- Anyone can view images (bucket is public)
create policy "Public read access for recipe images"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

-- Household members can upload images
create policy "Household members can upload recipe images"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

-- Household members can overwrite images
create policy "Household members can update recipe images"
  on storage.objects for update
  using (
    bucket_id = 'recipe-images'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'recipe-images'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

-- Household members can delete images
create policy "Household members can delete recipe images"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-images'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );
