"use client";

import { useState } from "react";
import Link from "next/link";
import { STORE, formatPrice } from "@/lib/config";
import { getSupabase } from "@/lib/supabase";
import { clean, EMAIL_RE, LIMITS } from "@/lib/security";
import { Honeypot } from "@/components/honeypot";
import { LocationMap } from "@/components/location-map";

const icon = "h-8 w-8 shrink-0";

function TruckIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 4h13v11H1zM14 8h4l3 3v4h-7z" />
      <circle cx="5.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.7z" />
      <path d="M9 9.5c.3 2.2 2.3 4.3 4.6 4.8l1-1.1 1.6.8-.4 1.5c-3.6.2-7.4-3.6-7.2-7.2l1.5-.4.8 1.6z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="1.5" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  );
}

/** Franja de beneficios arriba del pie: envíos, WhatsApp y medios de pago */
function Benefits() {
  const items = [
    {
      icon: <TruckIcon />,
      title: "Enviamos tu compra",
      text: `Envíos gratis en compras +${formatPrice(STORE.freeShippingFrom).replace(/,00$/, "").replace(/\s/g, "")}`,
    },
    {
      icon: <ChatIcon />,
      title: "Chateá con nosotros",
      text: "Haciendo click acá",
      href: `https://wa.me/${STORE.whatsapp}`,
    },
    {
      icon: <CardIcon />,
      title: "Pagá como quieras",
      text: "Tarjetas de crédito o débito, efectivo o transferencia con Mercado Pago",
    },
  ];
  return (
    <section className="mx-auto mt-20 grid w-full max-w-5xl gap-8 px-4 py-10 md:grid-cols-3 md:gap-0">
      {items.map((it, i) => {
        const body = (
          <>
            {it.icon}
            <div>
              <p className="text-sm font-bold tracking-wide uppercase">{it.title}</p>
              <p className="text-sm text-neutral-600">{it.text}</p>
            </div>
          </>
        );
        const cls = `flex items-start gap-4 md:px-8 ${i > 0 ? "md:border-l md:border-neutral-300" : ""}`;
        return it.href ? (
          <a key={it.title} href={it.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:opacity-70`}>
            {body}
          </a>
        ) : (
          <div key={it.title} className={cls}>{body}</div>
        );
      })}
    </section>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [trap, setTrap] = useState("");

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) return setMsg("¡Gracias por suscribirte!"); // honeypot
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
    <>
      <Benefits />
      <LocationMap />
      <footer>
        <div className="bg-neutral-900 text-white">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 text-sm sm:grid-cols-2 md:grid-cols-[1fr_1fr_1.4fr]">
            <div>
              <h4 className="mb-3 font-bold tracking-wide uppercase">Navegación</h4>
              <ul className="space-y-1.5 text-neutral-300">
                <li><Link href="/productos" className="hover:text-white">Todos los productos</Link></li>
                <li><Link href="/info#faq" className="hover:text-white">Preguntas frecuentes</Link></li>
                <li><Link href="/info#devoluciones" className="hover:text-white">Política de devolución</Link></li>
                <li><Link href="/info#terminos" className="hover:text-white">Términos y condiciones</Link></li>
                <li><a href="#ubicacion" className="hover:text-white">Dónde estamos</a></li>
                <li><Link href="/info#privacidad" className="hover:text-white">Política de privacidad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-bold tracking-wide uppercase">Formas de envío</h4>
              <span className="inline-block rounded-sm bg-[#FFCE00] px-2 py-1 text-[10px] leading-tight font-bold text-[#003876] uppercase">
                Correo<br />Argentino
              </span>
              <p className="mt-2 text-neutral-300">Moto en CABA / GBA</p>
            </div>
            <div>
              <h4 className="mb-3 font-bold tracking-wide uppercase">Redes sociales</h4>
              <a
                href={STORE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram de ${STORE.name}`}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-black transition hover:scale-110"
              >
                <InstagramIcon />
              </a>
              <h4 className="mt-6 mb-3 font-bold tracking-wide uppercase">Newsletter</h4>
              <form onSubmit={subscribe} className="relative flex max-w-60">
                <Honeypot value={trap} onChange={setTrap} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Tu email"
                  maxLength={LIMITS.email}
                  className="min-w-0 flex-1 border border-white bg-neutral-900 px-3 py-2 text-white outline-none placeholder:text-neutral-400"
                />
                <button aria-label="Suscribirme" className="grid w-11 place-items-center border border-white bg-white text-black hover:bg-neutral-200">
                  <SendIcon />
                </button>
              </form>
              {msg && <p className="mt-2 text-xs text-neutral-300">{msg}</p>}
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 pt-4 pb-20 md:pb-4 text-[10px] tracking-wide text-neutral-500 uppercase md:flex-row md:items-start md:justify-between">
          <p className="font-logo text-sm tracking-normal text-black normal-case">{STORE.name}</p>
          <div className="space-y-1 md:pr-16 md:text-right">
            <p>Copyright {STORE.name} - {new Date().getFullYear()}. Todos los derechos reservados.</p>
            <p>
              Defensa de las y los consumidores. Para reclamos{" "}
              <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener noreferrer" className="font-bold text-black hover:underline">
                ingresá acá
              </a>
              {" / "}
              <Link href="/arrepentimiento" className="font-bold text-black hover:underline">Botón de arrepentimiento</Link>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
