-- =========================================================
-- FEELS INDUMENTARIA — esquema para Supabase (plan Free)
-- Pegá todo este archivo en Supabase > SQL Editor > Run
-- =========================================================

-- ---------- Tablas ----------
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  name        text not null,
  sort_order  int  not null default 0
);

create table if not exists public.products (
  id              bigint generated always as identity primary key,
  slug            text unique not null,
  name            text not null check (char_length(name) between 2 and 100),
  description     text check (description is null or char_length(description) <= 2000),
  price           numeric(12,2) not null check (price >= 0),
  image_url       text,
  category_id     bigint references public.categories(id) on delete set null,
  sizes           text[] not null default array['S','M','L','XL'],
  promo_label     text,          -- ej: "10% OFF"
  promo_min_qty   int,           -- ej: 2  ("comprando 2 o más")
  promo_percent   int,           -- ej: 10
  stock           int not null default 0 check (stock >= 0),
  -- (las promos tienen que ser coherentes: 1..90 % y mínimo 1 unidad)
  check (promo_percent is null or promo_percent between 1 and 90),
  check (promo_min_qty is null or promo_min_qty >= 1),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.orders (
  id              bigint generated always as identity primary key,
  customer_name   text not null check (char_length(customer_name) between 2 and 80),
  customer_email  text not null check (char_length(customer_email) <= 120
                                       and customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone  text check (customer_phone is null or customer_phone ~ '^[0-9 +()-]{6,25}$'),
  address         text check (address is null or char_length(address) <= 200),
  subtotal        numeric(12,2) not null,
  discount        numeric(12,2) not null default 0,
  shipping        numeric(12,2) not null default 0,
  total           numeric(12,2) not null,
  status          text not null default 'pendiente'
                  check (status in ('pendiente','pagado','enviado','cancelado')),
  created_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders(id) on delete cascade,
  product_id  bigint references public.products(id) on delete set null,
  name        text not null,
  size        text not null,
  unit_price  numeric(12,2) not null,
  quantity    int not null check (quantity > 0)
);

create table if not exists public.newsletter (
  id          bigint generated always as identity primary key,
  email       text unique not null check (char_length(email) <= 120
                                          and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at  timestamptz not null default now()
);

-- Lista de administradores (usuarios de Supabase Auth)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------- Row Level Security ----------
alter table public.admins      enable row level security;
drop policy if exists "admin sees self" on public.admins;
create policy "admin sees self" on public.admins
  for select to authenticated using (user_id = auth.uid());

alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter  enable row level security;

-- Público: puede leer categorías y productos activos
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products
  for select using (active or public.is_admin());

-- Público: puede suscribirse al newsletter (solo insertar)
drop policy if exists "public subscribe" on public.newsletter;
create policy "public subscribe" on public.newsletter
  for insert with check (true);

-- Admin (usuarios presentes en public.admins): gestiona todo
drop policy if exists "admin all products" on public.products;
create policy "admin all products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all categories" on public.categories;
create policy "admin all categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read items" on public.order_items;
create policy "admin read items" on public.order_items
  for select to authenticated using (public.is_admin());

drop policy if exists "admin read newsletter" on public.newsletter;
create policy "admin read newsletter" on public.newsletter
  for select to authenticated using (public.is_admin());

-- ---------- Checkout seguro (RPC) ----------
-- El cliente NO puede escribir orders directamente: llama a esta función,
-- que recalcula precios desde la base, aplica promos, descuenta stock
-- y crea la orden de forma atómica.
create or replace function public.create_order(
  p_name text, p_email text, p_phone text, p_address text, p_items jsonb
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id  bigint;
  v_item      jsonb;
  v_prod      public.products%rowtype;
  v_qty       int;
  v_subtotal  numeric := 0;
  v_discount  numeric := 0;
  v_shipping  numeric;
  v_line      numeric;
  v_prod_qty  int;
begin
  -- Validaciones (no confiamos en nada de lo que manda el navegador)
  p_name    := trim(p_name);
  p_email   := lower(trim(p_email));
  p_phone   := nullif(trim(p_phone), '');
  p_address := nullif(trim(p_address), '');

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Demasiados productos en un solo pedido';
  end if;
  if p_name is null or char_length(p_name) not between 2 and 80 then
    raise exception 'Nombre inválido';
  end if;
  if p_email is null or char_length(p_email) > 120 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email inválido';
  end if;
  if p_phone is not null and p_phone !~ '^[0-9 +()-]{6,25}$' then
    raise exception 'Teléfono inválido';
  end if;
  if p_address is null or char_length(p_address) > 200 then
    raise exception 'Dirección inválida';
  end if;

  -- Límite anti-spam: máximo 5 pedidos por email por hora
  if (select count(*) from orders
       where customer_email = p_email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Demasiados pedidos seguidos. Probá de nuevo más tarde.';
  end if;

  insert into orders (customer_name, customer_email, customer_phone, address, subtotal, total)
  values (p_name, p_email, p_phone, p_address, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'Cantidad inválida';
    end if;

    select * into v_prod from products
      where id = (v_item->>'product_id')::bigint and active
      for update;
    if not found then raise exception 'Producto no disponible'; end if;
    if not ((v_item->>'size') = any(v_prod.sizes)) then
      raise exception 'Talle inválido para %', v_prod.name;
    end if;
    if v_prod.stock < v_qty then
      raise exception 'Sin stock suficiente de %', v_prod.name;
    end if;

    update products set stock = stock - v_qty where id = v_prod.id;

    insert into order_items (order_id, product_id, name, size, unit_price, quantity)
    values (v_order_id, v_prod.id, v_prod.name, v_item->>'size', v_prod.price, v_qty);

    v_line := v_prod.price * v_qty;
    v_subtotal := v_subtotal + v_line;
  end loop;

  -- Promos "X% OFF comprando N o más" (por producto, sumando todos los talles)
  for v_prod in
    select p.* from products p
    where p.id in (select product_id from order_items where order_id = v_order_id)
      and p.promo_percent is not null
  loop
    select sum(quantity) into v_prod_qty from order_items
      where order_id = v_order_id and product_id = v_prod.id;
    if v_prod_qty >= coalesce(v_prod.promo_min_qty, 1) then
      v_discount := v_discount + round(v_prod.price * v_prod_qty * v_prod.promo_percent / 100.0, 2);
    end if;
  end loop;

  v_shipping := case when (v_subtotal - v_discount) >= 10000 then 0 else 1500 end;

  update orders
     set subtotal = v_subtotal,
         discount = v_discount,
         shipping = v_shipping,
         total    = v_subtotal - v_discount + v_shipping
   where id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text,text,text,text,jsonb) from public;
grant execute on function public.create_order(text,text,text,text,jsonb) to anon, authenticated;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Newsletter: guardar emails siempre en minúscula y sin espacios
create or replace function public.normalize_newsletter_email() returns trigger
language plpgsql set search_path = public as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;
drop trigger if exists newsletter_normalize on public.newsletter;
create trigger newsletter_normalize before insert on public.newsletter
  for each row execute function public.normalize_newsletter_email();

-- ---------- Cancelación atómica ----------
-- Al pasar un pedido a "cancelado" se devuelve el stock en la misma transacción
-- (o se hace todo o no se hace nada). Un pedido cancelado no se puede reactivar.
create or replace function public.restock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'cancelado' and new.status <> 'cancelado' then
    raise exception 'Un pedido cancelado no se puede reactivar';
  end if;
  if new.status = 'cancelado' and old.status <> 'cancelado' then
    update products p
       set stock = p.stock + oi.qty
      from (select product_id, sum(quantity) qty
              from order_items where order_id = new.id and product_id is not null
             group by product_id) oi
     where p.id = oi.product_id;
  end if;
  return new;
end;
$$;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock before update on public.orders
  for each row execute function public.restock_on_cancel();

-- Desde la app solo se puede cambiar el ESTADO de un pedido (montos y datos quedan fijos)
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;
grant update (status) on public.orders to authenticated;

-- ---------- Botón de arrepentimiento (Res. 424/2020) ----------
create table if not exists public.withdrawals (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null check (char_length(email) <= 120),
  reason      text check (reason is null or char_length(reason) <= 500),
  status      text not null default 'pendiente' check (status in ('pendiente','resuelto')),
  created_at  timestamptz not null default now()
);
alter table public.withdrawals enable row level security;
drop policy if exists "admin withdrawals" on public.withdrawals;
create policy "admin withdrawals" on public.withdrawals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Solo se registra si el pedido existe, es del mismo email y tiene menos de 10 días + envío (30 días)
create or replace function public.request_withdrawal(
  p_name text, p_email text, p_order_id bigint, p_reason text
) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  p_name  := trim(p_name);
  p_email := lower(trim(p_email));
  p_reason := nullif(trim(p_reason), '');
  if p_name is null or char_length(p_name) not between 2 and 80 then raise exception 'Nombre inválido'; end if;
  if p_reason is not null and char_length(p_reason) > 500 then raise exception 'Comentario demasiado largo'; end if;
  -- Mensaje genérico: no revela si el pedido existe para otro email
  if not exists (select 1 from orders where id = p_order_id and customer_email = p_email
                  and status <> 'cancelado' and created_at > now() - interval '30 days') then
    raise exception 'No encontramos un pedido vigente con ese número y email';
  end if;
  if (select count(*) from withdrawals where order_id = p_order_id) >= 3 then
    raise exception 'Ya recibimos tu solicitud para este pedido';
  end if;
  insert into withdrawals (order_id, name, email, reason)
  values (p_order_id, p_name, p_email, p_reason) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.request_withdrawal(text,text,bigint,text) from public;
grant execute on function public.request_withdrawal(text,text,bigint,text) to anon, authenticated;

-- ---------- Dar permisos de admin ----------
-- 1) Creá tu usuario en Supabase > Authentication > Users > Add user
-- 2) Ejecutá (cambiando el email):
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'tu-email@ejemplo.com';
