-- Actualización: compra mínima de $100.000 y sin costo de envío en la web.
-- Pegalo en Supabase > SQL Editor > New query y tocá Run. Se puede correr más de una vez.

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

  -- Compra mínima para pedidos con envío. El envío (Vía Cargo u otro) lo paga quien compra al transporte.
  if (v_subtotal - v_discount) < 100000 then
    raise exception 'La compra mínima para envíos es de $100.000.' using errcode = 'P0001';
  end if;
  v_shipping := 0;

  update orders
     set subtotal = v_subtotal,
         discount = v_discount,
         shipping = v_shipping,
         total    = v_subtotal - v_discount + v_shipping
   where id = v_order_id;

  return v_order_id;
end;
$$;
