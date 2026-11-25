import Link from "next/link";
import { STORE } from "@/lib/config";

export const metadata = {
  title: "Información legal",
  description: `Preguntas frecuentes, devoluciones, términos y condiciones y política de privacidad de ${STORE.name}.`,
};

const sections: [string, string, string[]][] = [
  ["faq", "Preguntas frecuentes", [
    "¿Cuánto tarda el envío? Entre 2 y 7 días hábiles según la zona.",
    "¿Cómo elijo el talle? Las prendas son oversize: si preferís un calce más justo, elegí un talle menos.",
  ]],
  ["devoluciones", "Política de cambios y devoluciones", [
    "Tenés 30 días desde que recibís tu compra para cambiarla. La prenda debe estar sin uso y con etiqueta.",
    "Además, por ser una compra a distancia, tenés 10 días corridos para arrepentirte de la compra sin dar motivos (Ley 24.240, art. 34). Podés hacerlo con el Botón de arrepentimiento.",
  ]],
  ["terminos", "Términos y condiciones", [
    `${STORE.name} vende indumentaria oversize por internet. Por ahora el sitio no procesa pagos: después de hacer tu pedido te contactamos para coordinar el pago y el envío.`,
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
