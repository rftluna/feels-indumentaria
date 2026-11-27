-- ============================================================
-- CATEGORÍAS EDITABLES DESDE EL PANEL (menú con subcategorías)
-- Pegá esto en Supabase > SQL Editor y tocá Run. Es seguro correrlo más de una vez.
-- ============================================================

-- Subcategorías: una categoría puede tener una categoría "madre" (un solo nivel).
alter table public.categories
  add column if not exists parent_id bigint references public.categories(id) on delete cascade;

-- Ocultar una categoría de la tienda sin borrarla.
alter table public.categories
  add column if not exists visible boolean not null default true;

create index if not exists categories_parent_idx on public.categories(parent_id);

alter table public.categories drop constraint if exists categories_no_self_parent;
alter table public.categories add constraint categories_no_self_parent check (parent_id is null or parent_id <> id);

alter table public.categories drop constraint if exists categories_name_len;
alter table public.categories add constraint categories_name_len check (char_length(trim(name)) between 1 and 40);

-- Solo se permite un nivel: la madre tiene que ser una categoría principal.
create or replace function public.check_category_level() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.parent_id is not null and exists (
    select 1 from categories where id = new.parent_id and parent_id is not null
  ) then
    raise exception 'Una subcategoría no puede tener subcategorías.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_level on public.categories;
create trigger categories_level before insert or update of parent_id on public.categories
  for each row execute function public.check_category_level();

-- Permisos: lectura pública y edición solo para administradoras (ya definidos en schema.sql;
-- se repiten por si acaso).
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
