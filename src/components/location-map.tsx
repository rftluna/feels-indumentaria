import { STORE } from "@/lib/config";

/** Sección "Dónde estamos": mapa de Google Maps embebido (sin API key) y link para llegar. */
export function LocationMap() {
  const q = encodeURIComponent(STORE.address);
  return (
    <section id="ubicacion" className="mx-auto w-full max-w-5xl scroll-mt-40 px-4 pb-12">
      <h2 className="mb-4 text-center text-lg font-bold tracking-widest uppercase">Dónde estamos</h2>
      <div className="aspect-video w-full overflow-hidden border border-neutral-200 md:aspect-[21/9]">
        <iframe
          title={`Mapa de ${STORE.name}`}
          src={`https://www.google.com/maps?q=${q}&output=embed`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="mt-3 text-center text-sm text-neutral-600">{STORE.address}</p>
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
