"use client";

import { useEffect, useState } from "react";
import { STORE } from "@/lib/config";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${STORE.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chateá con nosotros por WhatsApp"
      className="fixed right-5 bottom-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
      </svg>
    </a>
  );
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer preferencia guardada
    setShow(!localStorage.getItem("cookies-ok"));
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/90 px-4 py-3 text-xs text-white md:flex-row">
      <span>Al navegar por este sitio aceptás el uso de cookies para agilizar tu experiencia de compra.</span>
      <button
        onClick={() => { localStorage.setItem("cookies-ok", "1"); setShow(false); }}
        className="border border-white px-4 py-1 font-bold uppercase hover:bg-white hover:text-black"
      >
        Entendido
      </button>
    </div>
  );
}
