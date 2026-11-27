"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/config";
import { ADMIN_IDLE_MINUTES } from "@/lib/security";
import type { Category, Order, Product } from "@/lib/types";
import { arbolCategorias, normalizarCategoria } from "@/lib/categorias";
import { ChangePassword, Login } from "@/components/auth-forms";
import { CategoriasAdmin } from "./categorias-admin";
import { ActividadAdmin } from "./actividad-admin";
import { FotosAdmin } from "./fotos-admin";
import { ProductoForm } from "./producto-form";
import Image from "next/image";
import { borrarImagen } from "@/lib/imagenes";

type Withdrawal = { id: number; order_id: number; name: string; email: string; reason: string | null; status: string; created_at: string };

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
  const [tab, setTab] = useState<"orders" | "products" | "categories" | "photos" | "withdrawals" | "activity" | "access">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  // Formulario abierto: "nuevo" para crear, o el producto que se edita
  const [editando, setEditando] = useState<Product | "nuevo" | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  const load = useCallback(async () => {
    const [o, p, w, c] = await Promise.all([
      sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      sb.from("products").select("*").order("id"),
      sb.from("withdrawals").select("*").order("created_at", { ascending: false }),
      sb.from("categories").select("*").order("sort_order"),
    ]);
    setOrders(o.data ?? []);
    setProducts(p.data ?? []);
    setWithdrawals(w.data ?? []);
    setCategories((c.data ?? []).map(normalizarCategoria));
  }, [sb]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load();
  }, [load]);

  const setStatus = async (id: number, status: string) => {
    if (status === "cancelado" && !window.confirm(`¿Cancelar el pedido #${id}? Se devuelve el stock y no se puede reactivar.`)) return;
    const { error } = await sb.from("orders").update({ status }).eq("id", id);
    if (error) alert(error.code === "P0001" ? error.message : "No se pudo actualizar el pedido.");
    load();
  };

  const saveProduct = async (p: Product) => {
    if (!Number.isFinite(p.price) || p.price < 0 || !Number.isInteger(p.stock) || p.stock < 0) {
      alert("Precio y stock tienen que ser números positivos.");
      return;
    }
    const { error } = await sb.from("products").update({ price: p.price, stock: p.stock, active: p.active, category_id: p.category_id }).eq("id", p.id);
    if (error) alert("No se pudo guardar el producto. Recargá la página y probá de nuevo.");
    load();
  };

  const borrarProducto = async (p: Product) => {
    if (!window.confirm(`¿Borrar “${p.name}”? No se puede deshacer.\nLos pedidos ya hechos conservan el nombre del producto.\nSi solo querés que no se vea, destildá “Activo”.`)) return;
    const { error } = await sb.from("products").delete().eq("id", p.id);
    if (error) {
      setAviso("No se pudo borrar el producto. Probá de nuevo.");
    } else {
      await borrarImagen(sb, p.image_url);
      setAviso(`Se borró “${p.name}”.`);
    }
    load();
  };

  const productosFiltrados = products.filter((p) => p.name.toLowerCase().includes(filtro.trim().toLowerCase()));

  const revenue = orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat label="Pedidos" value={String(orders.length)} />
        <Stat label="Facturación" value={formatPrice(revenue)} />
        <Stat label="Productos activos" value={String(products.filter((p) => p.active).length)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold uppercase">
        {(["orders", "products", "categories", "photos", "withdrawals", "activity", "access"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`border px-4 py-2 ${tab === t ? "bg-black text-white" : "border-neutral-300"}`}>
            {{ orders: "Pedidos", products: "Productos", categories: "Categorías", photos: "Fotos", withdrawals: `Arrepentimientos (${withdrawals.filter((w) => w.status === "pendiente").length})`, activity: "Actividad", access: "Acceso" }[t]}
          </button>
        ))}
      </div>

      {tab === "access" ? (
        <ChangePassword email={email} />
      ) : tab === "activity" ? (
        <ActividadAdmin sb={sb} />
      ) : tab === "categories" ? (
        <CategoriasAdmin sb={sb} categorias={categories} products={products} onChange={load} />
      ) : tab === "photos" ? (
        <FotosAdmin sb={sb} products={products} onChange={load} />
      ) : tab === "withdrawals" ? (
        <ul className="space-y-2 text-sm">
          {withdrawals.length === 0 && <li className="text-neutral-500">No hay solicitudes.</li>}
          {withdrawals.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-3 border border-neutral-200 p-3">
              <b>ARR-{String(w.id).padStart(6, "0")}</b>
              <span>Pedido #{w.order_id}</span>
              <span>{w.name} · {w.email}</span>
              {w.reason && <span className="text-neutral-500">“{w.reason}”</span>}
              <span className="ml-auto text-xs uppercase">{w.status}</span>
              {w.status === "pendiente" && (
                <button onClick={async () => { await sb.from("withdrawals").update({ status: "resuelto" }).eq("id", w.id); load(); }} className="bg-black px-3 py-1 text-xs font-bold text-white uppercase">
                  Marcar resuelto
                </button>
              )}
            </li>
          ))}
        </ul>
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
                    <select value={o.status} disabled={o.status === "cancelado"} onChange={(e) => setStatus(o.id, e.target.value)} className="border border-neutral-300 px-2 py-1 disabled:bg-neutral-100">
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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => { setAviso(null); setEditando("nuevo"); }} className="cursor-pointer bg-black px-4 py-2 text-xs font-bold text-white uppercase">+ Nuevo producto</button>
            <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto" className="w-56 border border-neutral-300 px-3 py-2 text-sm" />
            <span className="text-xs text-neutral-500">{products.length} productos · {products.filter((p) => p.active).length} visibles en la tienda</span>
          </div>
          {aviso && <p className="border border-neutral-300 bg-neutral-50 p-3 text-sm">{aviso}</p>}
          {productosFiltrados.length === 0 && <p className="py-6 text-center text-sm text-neutral-500">{products.length ? "Ningún producto coincide con la búsqueda." : "Todavía no hay productos. Creá el primero con “Nuevo producto”."}</p>}
          {productosFiltrados.map((p) => (
            <ProductRow key={JSON.stringify(p)} product={p} categories={categories} onSave={saveProduct}
              onEdit={() => { setAviso(null); setEditando(p); }} onDelete={() => borrarProducto(p)} />
          ))}
        </div>
      )}

      {editando && (
        <ProductoForm
          sb={sb}
          categories={categories}
          products={products}
          producto={editando === "nuevo" ? undefined : editando}
          onCerrar={() => setEditando(null)}
          onGuardado={(msg) => { setEditando(null); setAviso(msg); load(); }}
        />
      )}
    </>
  );
}

type ProductRowProps = { product: Product; categories: Category[]; onSave: (p: Product) => void; onEdit: () => void; onDelete: () => void };

function ProductRow({ product, categories, onSave, onEdit, onDelete }: ProductRowProps) {
  const [p, setP] = useState(product);
  const arbol = arbolCategorias(categories, false);
  return (
    <div className={`flex flex-wrap items-center gap-3 border border-neutral-200 p-3 text-sm ${p.active ? "" : "bg-neutral-50"}`}>
      {p.image_url ? (
        <Image src={p.image_url} alt="" width={45} height={60} unoptimized className="h-[60px] w-[45px] object-cover" />
      ) : (
        <div className="grid h-[60px] w-[45px] place-items-center bg-neutral-100 text-[9px] text-neutral-500 uppercase">Sin foto</div>
      )}
      <span className="flex-1 font-semibold uppercase">{p.name}{!p.active && <span className="ml-2 text-[10px] font-normal text-neutral-500">(oculto)</span>}</span>
      <label>Precio <input type="number" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} className="w-24 border px-2 py-1" /></label>
      <label>Stock <input type="number" value={p.stock} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} className="w-16 border px-2 py-1" /></label>
      <label>Categoría{" "}
        <select value={p.category_id ?? ""} onChange={(e) => setP({ ...p, category_id: e.target.value ? Number(e.target.value) : null })} className="max-w-48 border px-2 py-1">
          <option value="">Sin categoría</option>
          {arbol.map((c) => [
            <option key={c.id} value={c.id}>{c.name}</option>,
            ...c.hijas.map((h) => <option key={h.id} value={h.id}>{"\u00a0\u00a0— "}{h.name}</option>),
          ])}
        </select>
      </label>
      <label className="flex items-center gap-1"><input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Activo</label>
      <button onClick={() => onSave(p)} className="cursor-pointer bg-black px-3 py-1 text-xs font-bold text-white uppercase">Guardar</button>
      <button onClick={onEdit} className="cursor-pointer border border-black px-3 py-1 text-xs font-bold uppercase">Editar todo</button>
      <button onClick={onDelete} className="cursor-pointer border border-neutral-400 px-3 py-1 text-xs uppercase text-red-700 hover:border-red-700">Borrar</button>
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
