-- Storage bucket for pantry scan images (receipts, shelf photos)
-- Temp storage, images can be cleaned up periodically

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pantry-scans',
  'pantry-scans',
  false,
  10485760, -- 10MB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Household members can upload scan images
create policy "Household members can upload pantry scans"
  on storage.objects for insert
  with check (
    bucket_id = 'pantry-scans'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

-- Household members can view their scan images
create policy "Household members can view pantry scans"
  on storage.objects for select
  using (
    bucket_id = 'pantry-scans'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

-- Household members can delete their scan images
create policy "Household members can delete pantry scans"
  on storage.objects for delete
  using (
    bucket_id = 'pantry-scans'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );
