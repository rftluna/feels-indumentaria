"use client";

import { useState } from "react";
import { STORE } from "@/lib/config";

/**
 * Sección "Dónde estamos". El mapa de Google se carga recién cuando la persona lo pide:
 * así Google no recibe la visita ni deja cookies propias sin una acción de quien navega.
 */
export function LocationMap() {
  const [verMapa, setVerMapa] = useState(false);
  const q = encodeURIComponent(STORE.mapQuery);
  return (
    <section id="ubicacion" className="mx-auto w-full max-w-5xl scroll-mt-40 px-4 pb-12">
      <h2 className="mb-4 text-center text-lg font-bold tracking-widest uppercase">Dónde estamos</h2>
      <div className="aspect-video w-full overflow-hidden border border-neutral-200 md:aspect-[21/9]">
        {verMapa ? (
          <iframe
            title={`Mapa de ${STORE.name}`}
            src={`https://www.google.com/maps?q=${q}&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-neutral-50 p-6 text-center">
            <div>
              <button onClick={() => setVerMapa(true)} className="cursor-pointer border border-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white">
                Ver mapa
              </button>
              <p className="mt-3 text-xs text-neutral-500">El mapa lo muestra Google Maps, que puede usar sus propias cookies.</p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-sm font-semibold">{STORE.address}</p>
      <p className="text-center text-sm text-neutral-600">{STORE.hours}</p>
      <p className="text-center">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold underline"
        >
          Cómo llegar
        </a>
      </p>
    </section>
  );
}
