"use client";

import { useState } from "react";
import Link from "next/link";
import { STORE } from "@/lib/config";
import { getSupabase } from "@/lib/supabase";
import { clean, EMAIL_RE, LIMITS } from "@/lib/security";

export function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = clean(email, LIMITS.email).toLowerCase();
    if (!EMAIL_RE.test(value)) return setMsg("Ingresá un email válido.");
    const sb = getSupabase();
    if (!sb) return setMsg("¡Gracias! (modo demo)");
    const { error } = await sb.from("newsletter").insert({ email: value });
    // Si el email ya existía (23505) mostramos lo mismo: no revelamos quién está suscripto.
    const ok = !error || error.code === "23505";
    setMsg(ok ? "¡Gracias por suscribirte!" : "No pudimos suscribirte. Probá más tarde.");
    if (ok) setEmail("");
  };

  return (
    <footer className="mt-20 bg-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm md:grid-cols-4">
        <div>
          <h4 className="mb-3 font-bold tracking-wider uppercase">Navegación</h4>
          <ul className="space-y-2 text-neutral-600">
            <li><Link href="/productos">Todos los productos</Link></li>
            <li><Link href="/info#faq">Preguntas frecuentes</Link></li>
            <li><Link href="/info#devoluciones">Política de devolución</Link></li>
            <li><Link href="/info#terminos">Términos y condiciones</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold tracking-wider uppercase">Formas de envío</h4>
          <p className="text-neutral-600">Correo a todo el país y moto en CABA / GBA. Gratis desde $10.000.</p>
        </div>
        <div>
          <h4 className="mb-3 font-bold tracking-wider uppercase">Redes sociales</h4>
          <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:underline">Instagram</a>
        </div>
        <div>
          <h4 className="mb-3 font-bold tracking-wider uppercase">Newsletter</h4>
          <form onSubmit={subscribe} className="flex">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              maxLength={LIMITS.email}
              className="min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2 outline-none"
            />
            <button className="bg-black px-4 text-xs font-bold text-white uppercase">Enviar</button>
          </form>
          {msg && <p className="mt-2 text-xs">{msg}</p>}
        </div>
      </div>
      <p className="border-t border-neutral-200 py-4 text-center text-[11px] tracking-wider text-neutral-500 uppercase">
        Copyright {STORE.name} - {new Date().getFullYear()}. Proyecto de portfolio · Next.js + Supabase + Vercel
      </p>
    </footer>
  );
}
