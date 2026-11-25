-- =========================================================
-- SLOW DAYS STORE — esquema para Supabase (plan Free)
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
  name            text not null,
  description     text,
  price           numeric(12,2) not null check (price >= 0),
  image_url       text,
  category_id     bigint references public.categories(id) on delete set null,
  sizes           text[] not null default array['S','M','L','XL'],
  promo_label     text,          -- ej: "10% OFF"
  promo_min_qty   int,           -- ej: 2  ("comprando 2 o más")
  promo_percent   int,           -- ej: 10
  stock           int not null default 0 check (stock >= 0),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.orders (
  id              bigint generated always as identity primary key,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,
  address         text,
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
  email       text unique not null,
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
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;
  if coalesce(trim(p_name),'') = '' or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Nombre o email inválido';
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

grant execute on function public.create_order(text,text,text,text,jsonb) to anon, authenticated;

-- ---------- Dar permisos de admin ----------
-- 1) Creá tu usuario en Supabase > Authentication > Users > Add user
-- 2) Ejecutá (cambiando el email):
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'tu-email@ejemplo.com';
