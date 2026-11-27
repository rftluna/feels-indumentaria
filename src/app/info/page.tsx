import Link from "next/link";
import { STORE, shortPrice } from "@/lib/config";
import { faq } from "@/lib/faq";

export const metadata = {
  title: "Información legal",
  description: `Preguntas frecuentes, devoluciones, términos y condiciones y política de privacidad de ${STORE.name}.`,
};

const waLink = `https://wa.me/${STORE.whatsapp}`;

const sections: [string, string, string[]][] = [
  ["devoluciones", "Política de cambios y devoluciones", [
    "Los cambios y devoluciones se realizan solo por falla de la prenda y por el mismo artículo. Escribinos por WhatsApp con una foto de la falla para coordinarlo.",
    "Además, si compraste por la web, la ley te da 10 días corridos desde que recibís el producto para arrepentirte de la compra sin dar motivos (Ley 24.240, art. 34). Podés hacerlo con el Botón de arrepentimiento.",
  ]],
  ["terminos", "Términos y condiciones", [
    `${STORE.name} vende indumentaria femenina en su local de ${STORE.address} y por internet. El sitio no procesa pagos: después de hacer tu pedido te contactamos para coordinar el pago (efectivo en el local o transferencia) y el envío.`,
    `La compra mínima para pedidos con envío es de ${shortPrice(STORE.minOrder)}. El envío se realiza por Vía Cargo o el transporte que elijas, y su costo lo abona quien compra.`,
    "Los precios están expresados en pesos argentinos e incluyen IVA. Las promociones aplican por producto y no son acumulables con otras ofertas.",
    "Nos reservamos el derecho de cancelar pedidos con datos falsos o sin stock disponible, devolviendo el stock reservado.",
  ]],
  ["privacidad", "Política de privacidad", [
    "Datos que guardamos: nombre, email, teléfono y dirección de envío de cada pedido, y el email de quienes se suscriben al newsletter.",
    "Para qué los usamos: solo para procesar y enviar tu pedido y, si te suscribiste, para enviarte novedades. No los vendemos ni compartimos con terceros.",
    "Dónde se guardan: en una base de datos de Supabase protegida con reglas de acceso; solo la administración de la tienda puede verlos.",
    "Cookies: el sitio no usa cookies de terceros ni de seguimiento. El carrito se guarda en el almacenamiento local de tu navegador.",
    "Tus derechos (Ley 25.326): podés pedir acceder, corregir o borrar tus datos escribiéndonos por WhatsApp o por email. La Agencia de Acceso a la Información Pública es el órgano de control.",
  ]],
];

export default function Info() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-14">
      <section id="faq" className="scroll-mt-40">
        <h2 className="text-xl font-bold tracking-wider uppercase">Preguntas frecuentes</h2>
        <dl className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
          {faq.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-neutral-700">{a}</dd>
            </div>
          ))}
        </dl>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-black px-6 py-3 text-xs font-bold tracking-widest text-white uppercase hover:bg-neutral-800">
          Pedir catálogo por WhatsApp
        </a>
      </section>
      {sections.map(([id, title, paragraphs]) => (
        <section key={id} id={id} className="scroll-mt-40">
          <h2 className="text-xl font-bold tracking-wider uppercase">{title}</h2>
          {paragraphs.map((p) => <p key={p} className="mt-3 text-neutral-700">{p}</p>)}
        </section>
      ))}
      <Link href="/arrepentimiento" className="inline-block border border-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white">
        Botón de arrepentimiento
      </Link>
      <p className="text-xs text-neutral-500">Textos de referencia: antes de operar comercialmente conviene que los revise un abogado.</p>
    </div>
  );
}
