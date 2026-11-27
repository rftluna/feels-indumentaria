"use client";

import { useRef, useState } from "react";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Category, Product } from "@/lib/types";
import { arbolCategorias, slugUnico } from "@/lib/categorias";

const boton = "bg-black px-3 py-1 text-xs font-bold text-white uppercase disabled:opacity-50 cursor-pointer";
const botonLinea = "border border-neutral-400 px-2 py-1 text-xs uppercase disabled:opacity-30 cursor-pointer hover:border-black";

/** Mensaje entendible para los errores más comunes */
function explicar(error: PostgrestError): string {
  if (error.code === "42703" || error.code === "PGRST204") return "Falta correr supabase/categorias.sql en Supabase (SQL Editor).";
  if (error.code === "23505") return "Ya existe una categoría con ese nombre.";
  if (error.code === "P0001") return error.message;
  if (error.code === "23514") return "El nombre tiene que tener entre 1 y 40 caracteres.";
  return "No se pudo guardar. Probá de nuevo.";
}

export function CategoriasAdmin({ sb, categorias, products, onChange }: { sb: SupabaseClient; categorias: Category[]; products: Product[]; onChange: () => void }) {
  const [nombre, setNombre] = useState("");
  const [madre, setMadre] = useState<string>("");
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const inputNuevo = useRef<HTMLInputElement>(null);

  const arbol = arbolCategorias(categorias, false);
  const cantidad = (id: number) => products.filter((p) => p.category_id === id).length;

  const ejecutar = async (tarea: () => Promise<PostgrestError | null>, ok: string) => {
    setOcupado(true);
    setMensaje(null);
    const error = await tarea();
    setOcupado(false);
    setMensaje(error ? explicar(error) : ok);
    onChange();
  };

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) return;
    const parent_id = madre ? Number(madre) : null;
    const hermanas = categorias.filter((c) => c.parent_id === parent_id);
    const sort_order = Math.max(0, ...hermanas.map((c) => c.sort_order)) + 1;
    const slug = slugUnico(n, categorias.map((c) => c.slug));
    ejecutar(async () => {
      const fila: Record<string, unknown> = { name: n, slug, sort_order };
      if (parent_id !== null) fila.parent_id = parent_id;
      const { error } = await sb.from("categories").insert(fila);
      if (!error) setNombre("");
      return error;
    }, `Se agregó “${n}”. En la tienda aparece en hasta un minuto.`);
  };

  const renombrar = (c: Category, n: string) =>
    ejecutar(async () => (await sb.from("categories").update({ name: n.trim() }).eq("id", c.id)).error, `Se renombró a “${n.trim()}”.`);

  const cambiarVisible = (c: Category) =>
    ejecutar(async () => (await sb.from("categories").update({ visible: !c.visible }).eq("id", c.id)).error, c.visible ? `“${c.name}” quedó oculta en la tienda.` : `“${c.name}” ya se ve en la tienda.`);

  // Sube o baja la categoría entre sus hermanas y renumera el orden (1, 2, 3...)
  const mover = (c: Category, delta: -1 | 1) => {
    const hermanas = (c.parent_id === null ? arbol : arbol.find((r) => r.id === c.parent_id)?.hijas ?? []).map((x) => x as Category);
    const i = hermanas.findIndex((x) => x.id === c.id);
    const j = i + delta;
    if (j < 0 || j >= hermanas.length) return;
    const nuevo = [...hermanas];
    [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
    ejecutar(async () => {
      const cambios = nuevo.map((x, k) => ({ id: x.id, sort_order: k + 1 })).filter((x) => hermanas.find((h) => h.id === x.id)?.sort_order !== x.sort_order);
      const res = await Promise.all(cambios.map((x) => sb.from("categories").update({ sort_order: x.sort_order }).eq("id", x.id)));
      return res.find((r) => r.error)?.error ?? null;
    }, "Orden actualizado.");
  };

  const borrar = (c: Category) => {
    const hijas = categorias.filter((x) => x.parent_id === c.id);
    const afectados = cantidad(c.id) + hijas.reduce((s, h) => s + cantidad(h.id), 0);
    const aviso = [
      `¿Borrar la categoría “${c.name}”?`,
      hijas.length ? `También se borran sus ${hijas.length} subcategorías.` : "",
      afectados ? `${afectados} producto(s) quedan sin categoría (no se borran).` : "",
    ].filter(Boolean).join("\n");
    if (!window.confirm(aviso)) return;
    ejecutar(async () => (await sb.from("categories").delete().eq("id", c.id)).error, `Se borró “${c.name}”.`);
  };

  const agregarSub = (c: Category) => {
    setMadre(String(c.id));
    inputNuevo.current?.focus();
  };

  return (
    <div className="space-y-6 text-sm">
      <p className="text-neutral-600">
        Estas categorías arman el menú de la tienda. Las subcategorías aparecen con un “+” dentro de su categoría.
        Para que un producto aparezca en una categoría, elegila en la pestaña Productos.
      </p>

      <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 border border-neutral-200 p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase">Nueva categoría</span>
          <input ref={inputNuevo} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={40} placeholder="Ej: Vestidos" className="w-56 border px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase">Dentro de</span>
          <select value={madre} onChange={(e) => setMadre(e.target.value)} className="border px-2 py-1">
            <option value="">— Categoría principal —</option>
            {arbol.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button disabled={ocupado || !nombre.trim()} className={boton}>Agregar</button>
      </form>

      {mensaje && <p className="border border-neutral-300 bg-neutral-50 p-3">{mensaje}</p>}

      <ul className="space-y-2">
        {arbol.length === 0 && <li className="text-neutral-500">Todavía no hay categorías.</li>}
        {arbol.map((c, i) => (
          <li key={c.id} className="border border-neutral-200">
            <Fila c={c} cantidad={cantidad(c.id)} primera={i === 0} ultima={i === arbol.length - 1} ocupado={ocupado}
              onRenombrar={renombrar} onVisible={cambiarVisible} onMover={mover} onBorrar={borrar} onSub={agregarSub} />
            {c.hijas.length > 0 && (
              <ul className="border-t border-neutral-100 bg-neutral-50 pl-8">
                {c.hijas.map((h, k) => (
                  <li key={h.id} className="border-b border-neutral-100 last:border-0">
                    <Fila c={h} cantidad={cantidad(h.id)} primera={k === 0} ultima={k === c.hijas.length - 1} ocupado={ocupado}
                      onRenombrar={renombrar} onVisible={cambiarVisible} onMover={mover} onBorrar={borrar} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

type FilaProps = {
  c: Category;
  cantidad: number;
  primera: boolean;
  ultima: boolean;
  ocupado: boolean;
  onRenombrar: (c: Category, n: string) => void;
  onVisible: (c: Category) => void;
  onMover: (c: Category, d: -1 | 1) => void;
  onBorrar: (c: Category) => void;
  onSub?: (c: Category) => void;
};

function Fila({ c, cantidad, primera, ultima, ocupado, onRenombrar, onVisible, onMover, onBorrar, onSub }: FilaProps) {
  const [n, setN] = useState(c.name);
  const cambiado = n.trim() !== c.name && n.trim().length > 0;
  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 ${c.visible ? "" : "opacity-60"}`}>
      <input value={n} onChange={(e) => setN(e.target.value)} maxLength={40} aria-label={`Nombre de ${c.name}`} className="w-48 border px-2 py-1 font-semibold uppercase" />
      {cambiado && <button disabled={ocupado} onClick={() => onRenombrar(c, n)} className={boton}>Guardar</button>}
      <span className="text-xs text-neutral-500">{cantidad} producto{cantidad === 1 ? "" : "s"}</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={c.visible} disabled={ocupado} onChange={() => onVisible(c)} /> Visible</label>
        <button disabled={ocupado || primera} onClick={() => onMover(c, -1)} aria-label={`Subir ${c.name}`} className={botonLinea}>↑</button>
        <button disabled={ocupado || ultima} onClick={() => onMover(c, 1)} aria-label={`Bajar ${c.name}`} className={botonLinea}>↓</button>
        {onSub && <button disabled={ocupado} onClick={() => onSub(c)} className={botonLinea}>+ Subcategoría</button>}
        <button disabled={ocupado} onClick={() => onBorrar(c)} className={`${botonLinea} text-red-700`}>Borrar</button>
      </div>
    </div>
  );
}
