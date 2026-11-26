import Link from "next/link";
import { STORE } from "@/lib/config";
import { faq } from "@/lib/faq";

export const metadata = {
  title: "Preguntas frecuentes",
  description: `Respuestas a las preguntas frecuentes sobre compras, envíos, pagos y talles de ${STORE.name}.`,
};

export default function PreguntasFrecuentes() {
  const waLink = `https://wa.me/${STORE.whatsapp}`;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold tracking-widest uppercase">Preguntas frecuentes</h1>
      <dl className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {faq.map(([q, a]) => (
          <div key={q} className="py-4">
            <dt className="font-semibold">{q}</dt>
            <dd className="mt-1 text-neutral-700">{a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-neutral-700">¿No encontraste lo que buscabas? Escribinos por WhatsApp.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-black px-6 py-3 text-xs font-bold tracking-widest text-white uppercase hover:bg-neutral-800">
          Escribir por WhatsApp
        </a>
        <Link href="/como-comprar" className="inline-block border border-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white">
          Cómo comprar
        </Link>
      </div>
    </div>
  );
}
