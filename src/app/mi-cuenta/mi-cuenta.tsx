"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/config";
import { clean, LIMITS, PHONE_RE } from "@/lib/security";
import { useEsAdmin, useSesion, type DatosCuenta } from "@/lib/use-sesion";
import type { Order } from "@/lib/types";
import { ChangePassword, Login } from "@/components/auth-forms";
import { RegistroForm } from "@/components/registro-form";

const input = "w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black";
const titulo = "mb-4 border-b border-neutral-200 pb-2 text-sm font-semibold tracking-[0.15em] uppercase";

/** Solo rutas internas ("/carrito"), nunca otro sitio ("//sitio.com", "https://...") */
const rutaSegura = (v: string | null) => (v && /^\/(?!\/)[\w\-/?=&.]*$/.test(v) ? v : null);

export function MiCuenta() {
  const { session, user, datos, lista, recuperando, terminarRecuperacion } = useSesion();
  const esAdmin = useEsAdmin(user?.id);
  const params = useSearchParams();
  const router = useRouter();
  const volver = rutaSegura(params.get("volver"));
  const [vista, setVista] = useState<"ingresar" | "crear">(params.get("crear") ? "crear" : "ingresar");

  // Si vino desde el carrito, al ingresar vuelve ahí
  useEffect(() => {
    if (session && volver && !recuperando) router.replace(volver);
  }, [session, volver, recuperando, router]);

  if (!getSupabase()) return <p className="text-neutral-600">Las cuentas necesitan Supabase configurado (modo demo).</p>;
  if (!lista) return <p className="text-neutral-500">Cargando...</p>;

  if (session && recuperando)
    return (
      <div className="mx-auto max-w-sm">
        <ChangePassword email={user?.email ?? ""} recovery onDone={terminarRecuperacion} />
      </div>
    );

  if (!session || !user)
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-6 text-center text-2xl uppercase">Mi cuenta</h1>
        <div className="mb-6 grid grid-cols-2 border-b border-neutral-200 text-sm tracking-wider uppercase">
          {(["ingresar", "crear"] as const).map((v) => (
            <button key={v} onClick={() => setVista(v)} aria-pressed={vista === v}
              className={`cursor-pointer pb-3 ${vista === v ? "border-b-2 border-black font-semibold" : "text-neutral-500"}`}>
              {v === "ingresar" ? "Ingresar" : "Crear cuenta"}
            </button>
          ))}
        </div>
        {vista === "ingresar" ? <Login destino="/mi-cuenta" /> : <RegistroForm destino="/mi-cuenta" />}
        {volver === "/carrito" && <p className="mt-6 text-center text-xs text-neutral-500">Después de ingresar volvés a tu carrito.</p>}
      </div>
    );

  return <Cuenta user={user} datos={datos} esAdmin={esAdmin} />;
}

function Cuenta({ user, datos, esAdmin }: { user: User; datos: DatosCuenta; esAdmin: boolean }) {
  const router = useRouter();
  const [clave, setClave] = useState(false);
  const salir = async () => {
    await getSupabase()?.auth.signOut();
    router.refresh();
  };
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-neutral-500 uppercase">Inicio / Mi cuenta</p>
          <h1 className="mt-1 text-3xl">Hola{datos.nombre ? `, ${datos.nombre.split(" ")[0]}` : ""}</h1>
        </div>
        <div className="flex gap-4 text-xs tracking-wider uppercase">
          {esAdmin && <Link href="/admin" className="underline">Ir al panel</Link>}
          <button onClick={salir} className="cursor-pointer underline">Cerrar sesión</button>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-[300px_1fr]">
        <section>
          <MisDatos user={user} datos={datos} />
          <div className="mt-8">
            <button onClick={() => setClave(!clave)} aria-expanded={clave} className="cursor-pointer text-xs tracking-wider uppercase underline">
              {clave ? "Ocultar" : "Cambiar contraseña"}
            </button>
            {clave && <div className="mt-4"><ChangePassword email={user.email ?? ""} /></div>}
          </div>
        </section>
        <section>
          <MisCompras userId={user.id} />
        </section>
      </div>
    </div>
  );
}

function MisDatos({ user, datos }: { user: User; datos: DatosCuenta }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: datos.nombre ?? "", telefono: datos.telefono ?? "", direccion: datos.direccion ?? "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = clean(form.nombre, LIMITS.name);
    const telefono = clean(form.telefono, LIMITS.phone);
    const direccion = clean(form.direccion, LIMITS.address);
    if (nombre.length < 2) return setMsg("Ingresá tu nombre.");
    if (telefono && !PHONE_RE.test(telefono)) return setMsg("El teléfono solo puede tener números, espacios, +, - y paréntesis.");
    setBusy(true);
    const { error } = await getSupabase()!.auth.updateUser({ data: { nombre, telefono, direccion } });
    setBusy(false);
    if (error) return setMsg("No se pudieron guardar los datos. Probá de nuevo.");
    setMsg(null);
    setEditando(false);
  };

  return (
    <div>
      <div className={`${titulo} flex items-center justify-between`}>
        <h2>Mis datos</h2>
        {!editando && (
          <button onClick={() => { setForm({ nombre: datos.nombre ?? "", telefono: datos.telefono ?? "", direccion: datos.direccion ?? "" }); setEditando(true); }}
            className="cursor-pointer text-xs font-semibold tracking-normal normal-case underline">
            Editar
          </button>
        )}
      </div>
      {editando ? (
        <form onSubmit={guardar} className="space-y-3">
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={LIMITS.name} placeholder="Nombre y apellido" autoComplete="name" className={input} />
          <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} maxLength={LIMITS.phone} placeholder="Teléfono" autoComplete="tel" className={input} />
          <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} maxLength={LIMITS.address} placeholder="Dirección de envío" autoComplete="street-address" className={input} />
          <p className="text-xs text-neutral-500">El email ({user.email}) no se puede cambiar desde acá.</p>
          {msg && <p role="alert" className="text-sm text-red-600">{msg}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="cursor-pointer bg-black px-4 py-2 text-xs font-bold text-white uppercase disabled:opacity-50">{busy ? "Guardando..." : "Guardar"}</button>
            <button type="button" onClick={() => setEditando(false)} className="cursor-pointer border border-neutral-400 px-4 py-2 text-xs uppercase">Cancelar</button>
          </div>
        </form>
      ) : (
        <dl className="space-y-2 text-sm">
          <Dato etiqueta="Nombre" valor={datos.nombre} />
          <Dato etiqueta="Email" valor={user.email} />
          <Dato etiqueta="Teléfono" valor={datos.telefono} />
          <Dato etiqueta="Dirección" valor={datos.direccion} />
        </dl>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wider text-neutral-500 uppercase">{etiqueta}</dt>
      <dd>{valor || <span className="text-neutral-400">—</span>}</dd>
    </div>
  );
}

const ESTADOS: Record<Order["status"], { texto: string; clase: string }> = {
  pendiente: { texto: "Pendiente de pago", clase: "bg-amber-50 text-amber-800" },
  pagado: { texto: "Pagado · en preparación", clase: "bg-sky-50 text-sky-800" },
  enviado: { texto: "Enviado", clase: "bg-green-50 text-green-800" },
  cancelado: { texto: "Cancelado", clase: "bg-neutral-100 text-neutral-500" },
};

function MisCompras({ userId }: { userId: string }) {
  const [pedidos, setPedidos] = useState<Order[] | null>(null);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    let vigente = true;
    getSupabase()!
      .from("orders")
      .select("id, created_at, total, subtotal, discount, status, address, order_items(id, name, size, quantity, unit_price)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!vigente) return;
        setFalla(Boolean(error));
        setPedidos((data as Order[] | null) ?? []);
      });
    return () => {
      vigente = false;
    };
  }, [userId]);

  return (
    <div>
      <h2 className={titulo}>Mis compras</h2>
      {pedidos === null ? (
        <p className="text-sm text-neutral-500">Cargando compras...</p>
      ) : falla ? (
        <p className="text-sm text-neutral-600">No pudimos cargar tus compras. Probá de nuevo en un rato.</p>
      ) : pedidos.length === 0 ? (
        <div className="text-sm">
          <p>¡Hacé tu primera compra!</p>
          <Link href="/productos" className="mt-2 inline-block text-xs tracking-wider text-neutral-600 uppercase underline">Ir a la tienda →</Link>
          <p className="mt-4 text-xs text-neutral-500">Acá aparecen las compras que hagas con tu sesión iniciada.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pedidos.map((o) => (
            <li key={o.id} className="border border-neutral-200 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Pedido #{o.id}</span>
                <span className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className={`px-2 py-0.5 text-xs ${ESTADOS[o.status]?.clase ?? ""}`}>{ESTADOS[o.status]?.texto ?? o.status}</span>
              </div>
              <ul className="mt-3 space-y-1 text-neutral-700">
                {o.order_items?.map((i) => (
                  <li key={i.id} className="flex justify-between gap-4">
                    <span>{i.quantity}× {i.name} <span className="text-neutral-500">(talle {i.size})</span></span>
                    <span>{formatPrice(Number(i.unit_price) * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                <span>Total{Number(o.discount) > 0 ? " (con descuento)" : ""}</span>
                <span>{formatPrice(Number(o.total))}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
