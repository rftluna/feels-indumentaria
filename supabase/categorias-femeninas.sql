-- ============================================================
-- OPCIONAL (solo Feels): carga las categorías del menú femenino.
-- Correlo DESPUÉS de supabase/categorias.sql. No borra las categorías actuales:
-- las viejas se pueden ocultar o borrar desde el panel (pestaña Categorías)
-- una vez que los productos tengan su categoría nueva.
-- ============================================================
insert into public.categories (slug, name, sort_order) values
  ('remeras',    'Remeras',    101),
  ('blusas',     'Blusas',     102),
  ('camisas',    'Camisas',    103),
  ('bodys',      'Bodys',      104),
  ('vestidos',   'Vestidos',   105),
  ('faldas',     'Faldas',     106),
  ('pantalones', 'Pantalones', 107),
  ('monos',      'Monos',      108),
  ('camperas',   'Camperas',   109)
on conflict (slug) do nothing;
