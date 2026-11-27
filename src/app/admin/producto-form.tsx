"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Product } from "@/lib/types";
import { arbolCategorias, slugUnico } from "@/lib/categorias";
import { borrarImagen, subirImagen, validarImagen } from "@/lib/imagenes";

/** Talles que se ofrecen con un clic; los demás (36, 38, Único...) se escriben a mano */
const TALLES_COMUNES = ["XS", "S", "M", "L", "XL", "XXL"];

const input = "w-full border border-neutral-300 px-3 py-2 outline-none focus:border-black";
const etiqueta = "mb-1 block text-xs font-bold tracking-wider uppercase";

type Props = {
  sb: SupabaseClient;
  categories: Category[];
  products: Product[];
  /** Producto a editar; sin producto, el formulario crea uno nuevo */
  producto?: Product;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
};

export function ProductoForm({ sb, categories, products, producto, onCerrar, onGuardado }: Props) {
  const nuevo = !producto;
  const [nombre, setNombre] = useState(producto?.name ?? "");
  const [descripcion, setDescripcion] = useState(producto?.description ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.price) : "");
  const [stock, setStock] = useState(producto ? String(producto.stock) : "");
  const [categoria, setCategoria] = useState(producto?.category_id ? String(producto.category_id) : "");
  const [talles, setTalles] = useState<string[]>(producto?.sizes.filter((t) => TALLES_COMUNES.includes(t)) ?? ["S", "M", "L"]);
  const [otrosTalles, setOtrosTalles] = useState(producto?.sizes.filter((t) => !TALLES_COMUNES.includes(t)).join(", ") ?? "");
  const [conPromo, setConPromo] = useState(Boolean(producto?.promo_percent));
  const [promoPorcentaje, setPromoPorcentaje] = useState(producto?.promo_percent ? String(producto.promo_percent) : "10");
  const [promoMinimo, setPromoMinimo] = useState(producto?.promo_min_qty ? String(producto.promo_min_qty) : "2");
  const [activo, setActivo] = useState(producto?.active ?? true);
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const arbol = arbolCategorias(categories, false);

  // Vista previa de la foto elegida: se libera al cambiarla o al cerrar el formulario
  const vistaRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (vistaRef.current) URL.revokeObjectURL(vistaRef.current);
  }, []);

  // Escape cierra el formulario
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !guardando && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onCerrar]);

  const alternarTalle = (t: string) => setTalles((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const elegirFoto = (f: File | undefined) => {
    if (!f) return;
    const problema = validarImagen(f);
    if (problema) return setError(problema);
    setError(null);
    if (vistaRef.current) URL.revokeObjectURL(vistaRef.current);
    vistaRef.current = URL.createObjectURL(f);
    setVistaPrevia(vistaRef.current);
    setFoto(f);
  };

  /** Valida y arma la fila para la base. Devuelve un mensaje si algo está mal. */
  const armar = (): Record<string, unknown> | string => {
    const n = nombre.trim();
    if (n.length < 2 || n.length > 100) return "El nombre tiene que tener entre 2 y 100 caracteres.";
    const d = descripcion.trim();
    if (d.length > 2000) return "La descripción puede tener hasta 2000 caracteres.";
    const p = Number(precio.replace(",", "."));
    if (!precio.trim() || !Number.isFinite(p) || p < 0) return "Ingresá un precio válido.";
    const s = Number(stock);
    if (!stock.trim() || !Number.isInteger(s) || s < 0) return "El stock tiene que ser un número entero (0 o más).";
    const extras = otrosTalles.split(",").map((t) => t.trim().slice(0, 10)).filter(Boolean);
    const todos = [...TALLES_COMUNES.filter((t) => talles.includes(t)), ...extras.filter((t) => !TALLES_COMUNES.includes(t))];
    if (todos.length === 0) return "Elegí al menos un talle.";
    let promo = { promo_label: null as string | null, promo_percent: null as number | null, promo_min_qty: null as number | null };
    if (conPromo) {
      const pct = Number(promoPorcentaje);
      const min = Number(promoMinimo);
      if (!Number.isInteger(pct) || pct < 1 || pct > 90) return "El descuento tiene que ser entre 1 y 90 %.";
      if (!Number.isInteger(min) || min < 1) return "La cantidad mínima de la promo tiene que ser 1 o más.";
      promo = { promo_label: `${pct}% OFF`, promo_percent: pct, promo_min_qty: min };
    }
    return {
      name: n,
      description: d || null,
      price: Math.round(p * 100) / 100,
      stock: s,
      sizes: [...new Set(todos)],
      category_id: categoria ? Number(categoria) : null,
      active: activo,
      ...promo,
    };
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const fila = armar();
    if (typeof fila === "string") return setError(fila);
    setGuardando(true);
    setError(null);
    let fotoNueva: string | null = null;
    try {
      if (foto) {
        fotoNueva = await subirImagen(sb, foto, `productos/${producto?.id ?? "nuevos"}`);
        fila.image_url = fotoNueva;
      }
      const { error: err } = nuevo
        ? await sb.from("products").insert({ ...fila, slug: slugUnico(String(fila.name), products.map((p) => p.slug)) })
        : await sb.from("products").update(fila).eq("id", producto!.id);
      if (err) {
        if (fotoNueva) await borrarImagen(sb, fotoNueva);
        setError(err.code === "23505" ? "Ya existe un producto con ese nombre. Cambiá el nombre." : "No se pudo guardar. Revisá los datos y probá de nuevo.");
        return;
      }
      // Si se reemplazó la foto, se borra la anterior del almacenamiento
      if (fotoNueva && producto?.image_url) await borrarImagen(sb, producto.image_url);
      onGuardado(nuevo ? `Se creó “${fila.name}”. En la tienda aparece en hasta un minuto.` : `Se guardaron los cambios de “${fila.name}”.`);
    } catch (e) {
      if (fotoNueva) await borrarImagen(sb, fotoNueva);
      setError(e instanceof Error ? e.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const fotoActual = vistaPrevia ?? producto?.image_url ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && !guardando && onCerrar()}>
      <form onSubmit={guardar} role="dialog" aria-modal="true" aria-label={nuevo ? "Nuevo producto" : `Editar ${producto?.name}`} className="my-auto w-full max-w-2xl space-y-5 bg-white p-6 text-sm shadow-xl md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl uppercase">{nuevo ? "Nuevo producto" : "Editar producto"}</h2>
          <button type="button" onClick={onCerrar} disabled={guardando} aria-label="Cerrar" className="cursor-pointer text-2xl leading-none text-neutral-500 hover:text-black">×</button>
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <div>
            <span className={etiqueta}>Foto</span>
            <label className="relative grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden border border-dashed border-neutral-400 bg-neutral-50 text-center text-xs text-neutral-500 hover:border-black">
              {fotoActual ? (
                <Image src={fotoActual} alt="Foto del producto" fill unoptimized className="object-cover" />
              ) : (
                <span className="px-3">Tocá para elegir una foto<br />(JPG, PNG o WebP, hasta 5 MB)</span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => elegirFoto(e.target.files?.[0])} />
            </label>
            {fotoActual && <p className="mt-1 text-center text-xs text-neutral-500">Tocá la foto para cambiarla</p>}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className={etiqueta}>Nombre</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} required placeholder="Ej: Vestido Lino Arena" className={input} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={etiqueta}>Precio ($)</span>
                <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" required placeholder="25000" className={input} />
              </label>
              <label className="block">
                <span className={etiqueta}>Stock</span>
                <input value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" required placeholder="10" className={input} />
              </label>
            </div>
            <label className="block">
              <span className={etiqueta}>Categoría</span>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={input}>
                <option value="">Sin categoría</option>
                {arbol.map((c) => [
                  <option key={c.id} value={c.id}>{c.name}</option>,
                  ...c.hijas.map((h) => <option key={h.id} value={h.id}>{"  — "}{h.name}</option>),
                ])}
              </select>
            </label>
          </div>
        </div>

        <label className="block">
          <span className={etiqueta}>Descripción</span>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={2000} rows={4} placeholder="Tela, calce, cuidados..." className={input} />
        </label>

        <div>
          <span className={etiqueta}>Talles</span>
          <div className="flex flex-wrap gap-2">
            {TALLES_COMUNES.map((t) => (
              <button key={t} type="button" onClick={() => alternarTalle(t)} aria-pressed={talles.includes(t)}
                className={`h-10 min-w-10 cursor-pointer border px-2 ${talles.includes(t) ? "border-black bg-black text-white" : "border-neutral-300 hover:border-black"}`}>
                {t}
              </button>
            ))}
          </div>
          <input value={otrosTalles} onChange={(e) => setOtrosTalles(e.target.value)} placeholder="Otros talles, separados por coma (ej: Único, 36, 38)" className={`${input} mt-2`} />
        </div>

        <div className="space-y-3 border border-neutral-200 p-4">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={conPromo} onChange={(e) => setConPromo(e.target.checked)} /> Promo por cantidad
          </label>
          {conPromo && (
            <div className="flex flex-wrap items-center gap-2">
              <input value={promoPorcentaje} onChange={(e) => setPromoPorcentaje(e.target.value)} inputMode="numeric" aria-label="Porcentaje de descuento" className="w-16 border border-neutral-300 px-2 py-1" />
              <span>% OFF comprando</span>
              <input value={promoMinimo} onChange={(e) => setPromoMinimo(e.target.value)} inputMode="numeric" aria-label="Cantidad mínima" className="w-14 border border-neutral-300 px-2 py-1" />
              <span>o más</span>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Visible en la tienda
        </label>

        {error && <p role="alert" className="border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCerrar} disabled={guardando} className="cursor-pointer border border-neutral-400 px-5 py-2 text-xs font-bold uppercase hover:border-black">Cancelar</button>
          <button disabled={guardando} className="cursor-pointer bg-black px-5 py-2 text-xs font-bold text-white uppercase disabled:opacity-50">
            {guardando ? "Guardando..." : nuevo ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
