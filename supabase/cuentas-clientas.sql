-- ============================================================
-- CUENTAS DE CLIENTAS: "Mi cuenta" con sus pedidos
-- Pegá esto en Supabase > SQL Editor y tocá Run. Es seguro correrlo más de una vez.
--
-- Cada pedido hecho con la sesión iniciada guarda el ID de la cuenta (user_id).
-- Cada clienta solo puede ver los pedidos con su propio ID: no alcanza con
-- conocer o registrar el email de otra persona.
-- ============================================================

-- Se completa solo al crear el pedido (create_order no cambia): auth.uid() es
-- la cuenta que está comprando, o null si compra sin cuenta.
alter table public.orders
  add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete set null;

create index if not exists orders_user_idx on public.orders(user_id);

drop policy if exists "clienta ve sus pedidos" on public.orders;
create policy "clienta ve sus pedidos" on public.orders
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "clienta ve items de sus pedidos" on public.order_items;
create policy "clienta ve items de sus pedidos" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

grant select on public.orders, public.order_items to authenticated;
