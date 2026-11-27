"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NodoCategoria } from "@/lib/categorias";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  categorias: NodoCategoria[];
  logueado: boolean;
  esAdmin: boolean;
  onCerrarSesion: () => void;
  buscar: (q: string) => void;
};

const fila = "flex w-full items-center justify-between border-b border-neutral-200 py-4 text-left text-base tracking-wider uppercase";

/** Menú lateral (estilo tienda de moda): Productos se despliega con sus categorías y subcategorías. */
export function MenuLateral({ abierto, onCerrar, categorias, logueado, esAdmin, onCerrarSesion, buscar }: Props) {
  const [productosAbierto, setProductosAbierto] = useState(true);
  const [abiertas, setAbiertas] = useState<number[]>([]);
  const [q, setQ] = useState("");

  // Mientras el menú está abierto: la página de atrás no scrollea y Escape lo cierra
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, onCerrar]);

  const alternar = (id: number) => setAbiertas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className={`fixed inset-0 z-[60] ${abierto ? "" : "pointer-events-none"}`} aria-hidden={!abierto}>
      <div onClick={onCerrar} className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${abierto ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        inert={!abierto}
        className={`absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col overflow-y-auto bg-white px-8 pt-6 pb-10 shadow-xl transition-transform duration-300 ${abierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button onClick={onCerrar} aria-label="Cerrar menú" className="-ml-1 w-fit cursor-pointer text-neutral-500 hover:text-black">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
        <p className="font-logo mt-8 mb-4 text-3xl font-medium tracking-[0.15em] uppercase">Menú</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscar(q);
          }}
          className="mb-2 flex items-center border-b border-neutral-300"
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar productos" className="min-w-0 flex-1 py-2 outline-none" />
          <button aria-label="Buscar" className="cursor-pointer">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="m17 17-4.5-4.5" /></svg>
          </button>
        </form>

        <nav>
          <Link href="/productos?orden=nuevos" onClick={onCerrar} className={`${fila} text-neutral-500 hover:text-black`}>New in</Link>

          <button onClick={() => setProductosAbierto(!productosAbierto)} aria-expanded={productosAbierto} className={`${fila} cursor-pointer ${productosAbierto ? "border-transparent" : ""}`}>
            Productos <Signo abierto={productosAbierto} />
          </button>
          {productosAbierto && (
            <ul className="border-b border-neutral-200 pb-4 pl-6">
              <li>
                <Link href="/productos" onClick={onCerrar} className="block py-2 tracking-wider text-neutral-500 uppercase hover:text-black">Ver todo</Link>
              </li>
              {categorias.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between">
                    <Link href={`/productos?categoria=${c.slug}`} onClick={onCerrar} className="block flex-1 py-2 tracking-wider text-neutral-500 uppercase hover:text-black">
                      {c.name}
                    </Link>
                    {c.hijas.length > 0 && (
                      <button onClick={() => alternar(c.id)} aria-expanded={abiertas.includes(c.id)} aria-label={`Ver tipos de ${c.name}`} className="cursor-pointer p-2 text-neutral-500 hover:text-black">
                        <Signo abierto={abiertas.includes(c.id)} />
                      </button>
                    )}
                  </div>
                  {c.hijas.length > 0 && abiertas.includes(c.id) && (
                    <ul className="pl-5">
                      {c.hijas.map((h) => (
                        <li key={h.id}>
                          <Link href={`/productos?categoria=${h.slug}`} onClick={onCerrar} className="block py-1.5 text-sm tracking-wider text-neutral-500 uppercase hover:text-black">
                            {h.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Link href="/productos?ofertas=1" onClick={onCerrar} className={`${fila} text-neutral-500 hover:text-black`}>Ofertas</Link>
          <Link href="/como-comprar" onClick={onCerrar} className={`${fila} text-neutral-500 hover:text-black`}>Cómo comprar</Link>
          <Link href="/contacto" onClick={onCerrar} className={`${fila} text-neutral-500 hover:text-black`}>Contacto</Link>
          <Link href="/preguntas-frecuentes" onClick={onCerrar} className={`${fila} text-neutral-500 hover:text-black`}>Preguntas frecuentes</Link>
          <Link href="/mi-cuenta" onClick={onCerrar} className={`${fila} text-neutral-500 hover:text-black`}>{logueado ? "Mi cuenta" : "Ingresar / Crear cuenta"}</Link>
        </nav>

        <div className="mt-8 flex gap-6 text-xs tracking-widest text-neutral-500 uppercase">
          <Link href="/admin" onClick={onCerrar} className="hover:text-black">{esAdmin ? "Panel" : "Admin"}</Link>
          {logueado && (
            <button onClick={onCerrarSesion} className="cursor-pointer uppercase hover:text-black">Cerrar sesión</button>
          )}
        </div>
      </aside>
    </div>
  );
}

/** "+" cerrado, "—" abierto */
function Signo({ abierto }: { abierto: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M3 12h18" />
      {!abierto && <path d="M12 3v18" />}
    </svg>
  );
}
