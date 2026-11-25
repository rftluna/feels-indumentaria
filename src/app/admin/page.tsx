"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/config";
import { ADMIN_IDLE_MINUTES } from "@/lib/security";
import type { Order, Product } from "@/lib/types";
import { ChangePassword, Login } from "./auth-forms";

const STATUSES: Order["status"][] = ["pendiente", "pagado", "enviado", "cancelado"];

export default function AdminPage() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Llegó desde el mail de "olvidé mi contraseña"
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, [sb]);

  // Verificamos en la base (tabla admins) si el usuario es administrador
  useEffect(() => {
    if (!sb || !session) return;
    sb.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [sb, session]);

  // Cierre de sesión automático por inactividad
  useEffect(() => {
    if (!sb || !session) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => sb.auth.signOut(), ADMIN_IDLE_MINUTES * 60_000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [sb, session]);

  if (!sb)
    return (
      <Shell>
        <p className="text-neutral-600">
          El panel de administración necesita Supabase. Configurá <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ver README).
        </p>
      </Shell>
    );

  if (!ready) return <Shell><p className="text-neutral-500">Cargando...</p></Shell>;

  if (session && recovery)
    return (
      <Shell>
        <ChangePassword email={session.user.email ?? ""} recovery onDone={() => setRecovery(false)} />
      </Shell>
    );

  if (!session) return <Shell><Login /></Shell>;

  if (isAdmin === null) return <Shell><p className="text-neutral-500">Verificando permisos...</p></Shell>;

  if (!isAdmin)
    return (
      <Shell>
        <p>Esta cuenta no tiene permiso para entrar al panel.</p>
        <button onClick={() => sb.auth.signOut()} className="mt-4 underline">Cerrar sesión</button>
      </Shell>
    );

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between text-sm">
        <span>Sesión: {session.user.email}</span>
        <button onClick={() => sb.auth.signOut()} className="underline">Cerrar sesión</button>
      </div>
      <Dashboard email={session.user.email ?? ""} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold tracking-widest uppercase">Panel de administración</h1>
      {children}
    </div>
  );
}

function Dashboard({ email }: { email: string }) {
  const sb = getSupabase()!;
  const [tab, setTab] = useState<"orders" | "products" | "access">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    const [o, p] = await Promise.all([
      sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      sb.from("products").select("*").order("id"),
    ]);
    setOrders(o.data ?? []);
    setProducts(p.data ?? []);
  }, [sb]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load();
  }, [load]);

  const setStatus = async (id: number, status: string) => {
    if (status === "cancelado" && !window.confirm(`¿Cancelar el pedido #${id}?`)) return;
    await sb.from("orders").update({ status }).eq("id", id);
    load();
  };

  const saveProduct = async (p: Product) => {
    if (!Number.isFinite(p.price) || p.price < 0 || !Number.isInteger(p.stock) || p.stock < 0) {
      alert("Precio y stock tienen que ser números positivos.");
      return;
    }
    await sb.from("products").update({ price: p.price, stock: p.stock, active: p.active }).eq("id", p.id);
    load();
  };

  const revenue = orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat label="Pedidos" value={String(orders.length)} />
        <Stat label="Facturación" value={formatPrice(revenue)} />
        <Stat label="Productos activos" value={String(products.filter((p) => p.active).length)} />
      </div>

      <div className="mb-4 flex gap-2 text-xs font-bold uppercase">
        {(["orders", "products", "access"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border px-4 py-2 ${tab === t ? "bg-black text-white" : "border-neutral-300"}`}>
            {{ orders: "Pedidos", products: "Productos", access: "Acceso" }[t]}
          </button>
        ))}
      </div>

      {tab === "access" ? (
        <ChangePassword email={email} />
      ) : tab === "orders" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase"><tr><th className="py-2">#</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b align-top">
                  <td className="py-3">{o.id}<br /><span className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString("es-AR")}</span></td>
                  <td>{o.customer_name}<br /><span className="text-xs text-neutral-500">{o.customer_email}</span></td>
                  <td className="text-xs">{o.order_items?.map((i) => <div key={i.id}>{i.quantity}× {i.name} ({i.size})</div>)}</td>
                  <td>{formatPrice(Number(o.total))}</td>
                  <td>
                    <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="border border-neutral-300 px-2 py-1">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-neutral-500">Todavía no hay pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => <ProductRow key={p.id} product={p} onSave={saveProduct} />)}
        </div>
      )}
    </>
  );
}

function ProductRow({ product, onSave }: { product: Product; onSave: (p: Product) => void }) {
  const [p, setP] = useState(product);
  return (
    <div className="flex flex-wrap items-center gap-3 border border-neutral-200 p-3 text-sm">
      <span className="flex-1 font-semibold uppercase">{p.name}</span>
      <label>Precio <input type="number" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} className="w-24 border px-2 py-1" /></label>
      <label>Stock <input type="number" value={p.stock} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} className="w-16 border px-2 py-1" /></label>
      <label className="flex items-center gap-1"><input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Activo</label>
      <button onClick={() => onSave(p)} className="bg-black px-3 py-1 text-xs font-bold text-white uppercase">Guardar</button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
