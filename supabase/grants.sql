-- ============================================================
-- PERMISOS DE TABLAS PARA LA API (Supabase no los da por defecto)
-- Pegá esto en SQL Editor y tocá Run. Es seguro correrlo más de una vez.
-- ============================================================
grant usage on schema public to anon, authenticated;

-- Público: ver catálogo y suscribirse al newsletter
grant select on public.categories, public.products to anon, authenticated;
grant insert on public.newsletter to anon, authenticated;

-- Administradora: gestiona catálogo, pedidos, arrepentimientos y lista de admins
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.newsletter, public.admins, public.orders, public.order_items to authenticated;
grant update (status) on public.orders to authenticated;
grant select, update on public.withdrawals to authenticated;
