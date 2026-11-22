-- The storefront writes product images with the service role, which bypasses RLS,
-- so no client role gets a write policy.
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Public read access" on storage.objects;

create policy "Public read access"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');
