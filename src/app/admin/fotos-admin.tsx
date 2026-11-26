"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";
import { PORTADA_DEFAULT, borrarImagen, subirImagen } from "@/lib/imagenes";

const boton = "bg-black px-3 py-1 text-xs font-bold text-white uppercase disabled:opacity-50";
const botonLinea = "border border-black px-3 py-1 text-xs font-bold uppercase disabled:opacity-50";

export function FotosAdmin({ sb, products, onChange }: { sb: SupabaseClient; products: Product[]; onChange: () => void }) {
  const [portada, setPortada] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    sb.from("site_images").select("url").eq("key", "portada").maybeSingle()
      .then(({ data }) => setPortada(data?.url ?? null));
  }, [sb]);

  const ejecutar = async (id: string, tarea: () => Promise<void>, ok: string) => {
    setOcupado(id);
    setMensaje(null);
    try {
      await tarea();
      setMensaje(ok);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Algo salió mal. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  };

  const cambiarPortada = (file: File) =>
    ejecutar("portada", async () => {
      const url = await subirImagen(sb, file, "portada");
      const { error } = await sb.from("site_images").upsert({ key: "portada", url, updated_at: new Date().toISOString() });
      if (error) {
        await borrarImagen(sb, url);
        throw new Error("No pudimos guardar la portada.");
      }
      await borrarImagen(sb, portada);
      setPortada(url);
    }, "Portada actualizada. Puede tardar hasta un minuto en verse en la tienda.");

  const restaurarPortada = () => {
    if (!window.confirm("¿Borrar la portada subida y volver a la foto original?")) return;
    ejecutar("portada", async () => {
      const { error } = await sb.from("site_images").delete().eq("key", "portada");
      if (error) throw new Error("No pudimos borrar la portada.");
      await borrarImagen(sb, portada);
      setPortada(null);
    }, "Se volvió a la portada original.");
  };

  const cambiarFotoProducto = (p: Product, file: File) =>
    ejecutar(`p${p.id}`, async () => {
      const url = await subirImagen(sb, file, `productos/${p.id}`);
      const { error } = await sb.from("products").update({ image_url: url }).eq("id", p.id);
      if (error) {
        await borrarImagen(sb, url);
        throw new Error("No pudimos guardar la foto del producto.");
      }
      await borrarImagen(sb, p.image_url);
      onChange();
    }, `Foto de ${p.name} actualizada.`);

  const borrarFotoProducto = (p: Product) => {
    if (!window.confirm(`¿Borrar la foto de ${p.name}? El producto queda sin foto.`)) return;
    ejecutar(`p${p.id}`, async () => {
      const { error } = await sb.from("products").update({ image_url: null }).eq("id", p.id);
      if (error) throw new Error("No pudimos borrar la foto del producto.");
      await borrarImagen(sb, p.image_url);
      onChange();
    }, `Se borró la foto de ${p.name}.`);
  };

  return (
    <div className="space-y-8 text-sm">
      {mensaje && <p className="border border-neutral-300 bg-neutral-50 p-3">{mensaje}</p>}

      <section>
        <h2 className="mb-3 text-xs font-bold tracking-widest uppercase">Portada</h2>
        <div className="flex flex-wrap items-center gap-4 border border-neutral-200 p-3">
          <Image src={portada ?? PORTADA_DEFAULT} alt="Portada actual" width={240} height={135} unoptimized className="h-[135px] w-[240px] object-cover" />
          <div className="space-y-2">
            <p className="text-neutral-600">{portada ? "Portada subida desde el panel." : "Foto original (todavía no subiste una)."}</p>
            <div className="flex flex-wrap gap-2">
              <SubirArchivo texto={portada ? "Cambiar portada" : "Subir portada"} disabled={ocupado !== null} onFile={cambiarPortada} />
              {portada && <button onClick={restaurarPortada} disabled={ocupado !== null} className={botonLinea}>Borrar</button>}
            </div>
            <p className="text-xs text-neutral-500">Ideal: foto horizontal, al menos 1600 px de ancho. JPG, PNG o WebP de hasta 5 MB.</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold tracking-widest uppercase">Fotos de productos</h2>
        <div className="space-y-2">
          {products.length === 0 && <p className="text-neutral-500">Todavía no hay productos.</p>}
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 border border-neutral-200 p-3">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} width={60} height={80} unoptimized className="h-20 w-[60px] object-cover" />
              ) : (
                <div className="grid h-20 w-[60px] place-items-center bg-neutral-100 text-[10px] text-neutral-500 uppercase">Sin foto</div>
              )}
              <span className="flex-1 font-semibold uppercase">{p.name}</span>
              <SubirArchivo texto={p.image_url ? "Cambiar" : "Subir"} disabled={ocupado !== null} onFile={(f) => cambiarFotoProducto(p, f)} />
              {p.image_url && <button onClick={() => borrarFotoProducto(p)} disabled={ocupado !== null} className={botonLinea}>Borrar</button>}
              {ocupado === `p${p.id}` && <span className="text-xs text-neutral-500">Guardando...</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SubirArchivo({ texto, disabled, onFile }: { texto: string; disabled: boolean; onFile: (f: File) => void }) {
  return (
    <label className={`${boton} cursor-pointer ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      {texto}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
