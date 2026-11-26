"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { Logo } from "./logo";
import type { Category } from "@/lib/types";
import { STORE, shortPrice } from "@/lib/config";

export function Header({ categories }: { categories: Category[] }) {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/productos${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="bg-black py-2 text-center text-xs font-bold tracking-widest text-white uppercase">
        Envíos a todo el país · Compra mínima {shortPrice(STORE.minOrder)}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menú">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <form onSubmit={search} className="hidden items-center border-b border-neutral-300 md:flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar"
              className="w-40 py-1 text-sm outline-none"
            />
            <button aria-label="Buscar">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="m17 17-4.5-4.5" /></svg>
            </button>
          </form>
        </div>

        <Logo />

        <div className="flex items-center justify-end gap-4 text-xs font-semibold uppercase">
          <Link href="/admin" className="hidden hover:underline md:inline">Admin</Link>
          <Link href="/carrito" className="relative flex items-center gap-1" aria-label="Carrito">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l2.4 12h11.2L21 7H6.2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] text-white">{count}</span>
          </Link>
        </div>
      </div>

      <nav className={`${open ? "block" : "hidden"} border-y border-neutral-200 md:block`}>
        <ul className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wider uppercase md:flex-row md:justify-center md:gap-10">
          {open && (
            <li className="w-full md:hidden">
              <form onSubmit={search} className="flex border-b border-neutral-300">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="flex-1 py-1 outline-none" />
              </form>
            </li>
          )}
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/productos?categoria=${c.slug}`} onClick={() => setOpen(false)} className="hover:underline">
                {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/como-comprar" onClick={() => setOpen(false)} className="hover:underline">
              Cómo comprar
            </Link>
          </li>
          <li>
            <Link href="/contacto" onClick={() => setOpen(false)} className="hover:underline">
              Contacto
            </Link>
          </li>
          <li>
            <Link href="/preguntas-frecuentes" onClick={() => setOpen(false)} className="hover:underline">
              Preguntas frecuentes
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
