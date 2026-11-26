import { STORE } from "@/lib/config";

export const metadata = {
  title: "Contacto",
  description: `Cómo contactar a ${STORE.name}: WhatsApp, Instagram, horarios y dirección del local.`,
};

export default function Contacto() {
  const waLink = `https://wa.me/${STORE.whatsapp}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.mapQuery)}`;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold tracking-widest uppercase">Contacto</h1>
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold uppercase tracking-wide">WhatsApp</h2>
          <p className="mt-1 text-neutral-700">{STORE.whatsappLocal}</p>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block bg-black px-6 py-3 text-xs font-bold tracking-widest text-white uppercase hover:bg-neutral-800">
            Escribir por WhatsApp
          </a>
        </div>
        <div>
          <h2 className="font-semibold uppercase tracking-wide">Instagram</h2>
          <p className="mt-1 text-neutral-700">@textilfeels</p>
          <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block border border-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white">
            Seguinos en Instagram
          </a>
        </div>
        <div>
          <h2 className="font-semibold uppercase tracking-wide">Local</h2>
          <p className="mt-1 text-neutral-700">{STORE.address}</p>
          <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">
            Ver en Google Maps
          </a>
        </div>
        <div>
          <h2 className="font-semibold uppercase tracking-wide">Horarios</h2>
          <p className="mt-1 text-neutral-700">{STORE.hours}</p>
        </div>
      </div>
    </div>
  );
}
