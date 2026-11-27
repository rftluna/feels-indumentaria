-- ============================================================
-- HARDENING: registro de actividad y derechos de privacidad
-- Pegá esto en Supabase > SQL Editor y tocá Run. Es seguro correrlo más de una vez.
-- Requiere schema.sql (función is_admin) y cuentas-clientas.sql (orders.user_id).
--
-- SOC 2 CC7.2 / ISO 27001 A.8.15-A.8.16: registro de las acciones con privilegios.
-- ISO 27701 / Ley 25.326: la clienta puede eliminar su cuenta (supresión).
-- ============================================================

-- ---------- Registro de actividad (solo lectura para administradoras) ----------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  creado_en   timestamptz not null default now(),
  actor       uuid,          -- cuenta que hizo el cambio (null = Supabase: panel o SQL Editor)
  actor_email text,
  tabla       text not null,
  accion      text not null check (accion in ('INSERT', 'UPDATE', 'DELETE')),
  registro    text,          -- id del registro afectado
  detalle     jsonb          -- qué cambió (sin datos personales de clientas)
);
create index if not exists audit_log_fecha_idx on public.audit_log (creado_en desc);

alter table public.audit_log enable row level security;
drop policy if exists "admin lee auditoria" on public.audit_log;
create policy "admin lee auditoria" on public.audit_log
  for select to authenticated using (public.is_admin());

-- Nadie puede escribir, editar ni borrar el registro desde la app: solo los triggers.
revoke insert, update, delete on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create or replace function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nuevo jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_viejo jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_detalle jsonb;
begin
  -- Se registran las acciones de administración (panel con sesión de admin, o cambios
  -- hechos directo en Supabase). Las compras de clientas no se registran acá: el pedido
  -- ya es su propio registro y así no se duplican datos personales.
  if not (public.is_admin() or session_user <> 'authenticator') then
    return coalesce(new, old);
  end if;

  if tg_table_name in ('orders', 'withdrawals') then
    -- Tablas con datos personales: solo el cambio de estado
    v_detalle := jsonb_build_object('status_antes', v_viejo ->> 'status', 'status_despues', v_nuevo ->> 'status');
  elsif tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_array(v_viejo -> n.key, n.value)) into v_detalle
    from jsonb_each(v_nuevo) n
    where n.value is distinct from (v_viejo -> n.key);
    if v_detalle is null then return new; end if;  -- no cambió nada
  else
    v_detalle := coalesce(v_nuevo, v_viejo);
  end if;

  insert into public.audit_log (actor, actor_email, tabla, accion, registro, detalle)
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    tg_table_name,
    tg_op,
    coalesce(v_nuevo ->> 'id', v_viejo ->> 'id', v_nuevo ->> 'user_id', v_viejo ->> 'user_id', v_nuevo ->> 'key', v_viejo ->> 'key'),
    v_detalle
  );
  return coalesce(new, old);
end;
$$;
revoke all on function public.registrar_auditoria() from public, anon, authenticated;

drop trigger if exists auditoria on public.products;
create trigger auditoria after insert or update or delete on public.products
  for each row execute function public.registrar_auditoria();

drop trigger if exists auditoria on public.categories;
create trigger auditoria after insert or update or delete on public.categories
  for each row execute function public.registrar_auditoria();

-- site_images existe solo si se corrió fotos.sql
do $$
begin
  if to_regclass('public.site_images') is not null then
    execute 'drop trigger if exists auditoria on public.site_images';
    execute 'create trigger auditoria after insert or update or delete on public.site_images
             for each row execute function public.registrar_auditoria()';
  end if;
end;
$$;

drop trigger if exists auditoria on public.admins;
create trigger auditoria after insert or delete on public.admins
  for each row execute function public.registrar_auditoria();

drop trigger if exists auditoria on public.orders;
create trigger auditoria after update of status or delete on public.orders
  for each row execute function public.registrar_auditoria();

drop trigger if exists auditoria on public.withdrawals;
create trigger auditoria after update of status or delete on public.withdrawals
  for each row execute function public.registrar_auditoria();

-- Conservación: el registro se guarda 1 año. Para limpiar lo más viejo (correr a mano):
--   delete from public.audit_log where creado_en < now() - interval '1 year';

-- ---------- Supresión: la clienta elimina su cuenta ----------
-- Borra la cuenta (email, contraseña y datos guardados). Los pedidos se conservan por
-- obligaciones contables, pero quedan desvinculados de la cuenta (user_id = null).
create or replace function public.eliminar_mi_cuenta() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = 'P0001';
  end if;
  if public.is_admin() then
    raise exception 'Las cuentas de administración se eliminan desde Supabase.' using errcode = 'P0001';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
