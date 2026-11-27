"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import { Logo } from "./logo";
import { MenuLateral } from "./menu-lateral";
import type { Category } from "@/lib/types";
import { arbolCategorias } from "@/lib/categorias";
import { STORE, shortPrice } from "@/lib/config";
import { getSupabase } from "@/lib/supabase";

const linkNav = "py-3 hover:underline underline-offset-4";

export function Header({ categories }: { categories: Category[] }) {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [logueado, setLogueado] = useState(false);
  const arbol = arbolCategorias(categories);

  // Si hay una sesión iniciada (administración), mostramos "Cerrar sesión"
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setLogueado(Boolean(data.session)));
    const { data } = sb.auth.onAuthStateChange((_event, s) => setLogueado(Boolean(s)));
    return () => data.subscription.unsubscribe();
  }, []);

  const cerrarMenu = useCallback(() => setOpen(false), []);

  const buscar = (texto: string) => {
    router.push(`/productos${texto ? `?q=${encodeURIComponent(texto)}` : ""}`);
    setOpen(false);
  };

  const cerrarSesion = async () => {
    setOpen(false);
    await getSupabase()?.auth.signOut();
    router.refresh();
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-white">
      <div className="bg-rosa-100 py-2 text-center text-[11px] font-medium tracking-[0.2em] text-black uppercase">
        Envíos a todo el país · Compra mínima {shortPrice(STORE.minOrder)}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4">
        <div className="flex items-center gap-5">
          <button className="cursor-pointer" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              buscar(q);
            }}
            className="hidden items-center border-b border-neutral-300 md:flex"
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar productos" className="w-40 py-1 text-sm outline-none" />
            <button aria-label="Buscar" className="cursor-pointer">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="m17 17-4.5-4.5" /></svg>
            </button>
          </form>
        </div>

        <Logo />

        <div className="flex items-center justify-end gap-4 text-xs font-semibold uppercase">
          <Link href="/admin" className="hidden hover:underline md:inline">Admin</Link>
          {logueado && (
            <button onClick={cerrarSesion} className="hidden cursor-pointer uppercase hover:underline md:inline">
              Cerrar sesión
            </button>
          )}
          <Link href="/carrito" className="relative flex items-center gap-1" aria-label="Carrito">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l2.4 12h11.2L21 7H6.2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rosa-200 px-1 text-[10px] text-black">{count}</span>
          </Link>
        </div>
      </div>

      {/* En compu: barra con Productos desplegable. En celular todo va en el menú lateral. */}
      <nav className="hidden border-y border-neutral-200 md:block">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-4 text-[13px] font-normal tracking-[0.18em] uppercase">
          <li><Link href="/productos?orden=nuevos" className={linkNav}>New in</Link></li>
          <li className="group relative">
            <Link href="/productos" className={`${linkNav} inline-flex items-center gap-1`} aria-haspopup="true">
              Productos
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m2 4 3 3 3-3" /></svg>
            </Link>
            {arbol.length > 0 && (
              <div className="invisible absolute top-full left-1/2 z-50 w-max min-w-56 -translate-x-1/2 border border-neutral-200 bg-white p-6 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <ul className="columns-2 gap-10 text-xs">
                  <li className="mb-3 break-inside-avoid"><Link href="/productos" className="hover:underline">Ver todo</Link></li>
                  {arbol.map((c) => (
                    <li key={c.id} className="mb-3 break-inside-avoid">
                      <Link href={`/productos?categoria=${c.slug}`} className="hover:underline">{c.name}</Link>
                      {c.hijas.length > 0 && (
                        <ul className="mt-1.5 space-y-1 pl-3 font-normal text-neutral-500 normal-case">
                          {c.hijas.map((h) => (
                            <li key={h.id}><Link href={`/productos?categoria=${h.slug}`} className="hover:text-black hover:underline">{h.name}</Link></li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
          <li><Link href="/productos?ofertas=1" className={linkNav}>Ofertas</Link></li>
          <li><Link href="/como-comprar" className={linkNav}>Cómo comprar</Link></li>
          <li><Link href="/contacto" className={linkNav}>Contacto</Link></li>
          <li><Link href="/preguntas-frecuentes" className={linkNav}>Preguntas frecuentes</Link></li>
        </ul>
      </nav>
    </header>
    {/* Fuera del <header> para quedar por encima de todo (botón de WhatsApp, aviso de cookies) */}
    <MenuLateral abierto={open} onCerrar={cerrarMenu} categorias={arbol} logueado={logueado} onCerrarSesion={cerrarSesion} buscar={buscar} />
    </>
  );
}
