-- ============================================================
-- FOTOS: portada editable y fotos de productos subidas desde el panel
-- Pegá esto en Supabase > SQL Editor y tocá Run. Es seguro correrlo más de una vez.
-- Requiere que ya exista la función public.is_admin() (schema.sql).
-- ============================================================

-- ---------- Bucket de Storage "fotos" (lectura pública) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cualquiera puede ver las fotos; solo las administradoras suben, cambian o borran.
drop policy if exists "fotos: lectura publica" on storage.objects;
create policy "fotos: lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists "fotos: admin sube" on storage.objects;
create policy "fotos: admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and public.is_admin());

drop policy if exists "fotos: admin actualiza" on storage.objects;
create policy "fotos: admin actualiza" on storage.objects
  for update to authenticated using (bucket_id = 'fotos' and public.is_admin())
  with check (bucket_id = 'fotos' and public.is_admin());

drop policy if exists "fotos: admin borra" on storage.objects;
create policy "fotos: admin borra" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.is_admin());

-- ---------- Imágenes fijas del sitio (por ahora: la portada) ----------
create table if not exists public.site_images (
  key         text primary key check (key in ('portada')),
  url         text not null check (url ~ '^https://'),
  updated_at  timestamptz not null default now()
);

alter table public.site_images enable row level security;

drop policy if exists "public read site_images" on public.site_images;
create policy "public read site_images" on public.site_images
  for select using (true);

drop policy if exists "admin all site_images" on public.site_images;
create policy "admin all site_images" on public.site_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.site_images to anon, authenticated;
grant insert, update, delete on public.site_images to authenticated;
