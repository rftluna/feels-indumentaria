import Link from "next/link";
import { STORE, shortPrice } from "@/lib/config";

export const metadata = {
  title: "Cómo comprar",
  description: `Paso a paso para comprar en ${STORE.name}: carrito, datos de envío, pedido y pago.`,
};

const pasos: [string, string][] = [
  ["Elegí tus prendas", "Entrá a la categoría que te interese y tocá \"Agregar al carrito\" en cada producto. Podés seguir sumando prendas antes de terminar."],
  ["Revisá el carrito", `Si es para envío, la compra mínima es de ${shortPrice(STORE.minOrder)}. Si el total no llega, el carrito te avisa cuánto falta.`],
  ["Completá tus datos", "Ingresá nombre, email, teléfono y la dirección donde querés recibir el pedido."],
  ["Elegí el envío", `Enviamos por ${STORE.shippingCarriers}. El costo del envío lo paga quien compra, directo al transporte.`],
  ["Confirmá el pedido", "No se cobra nada en la web. Al confirmar, te mostramos el número de tu pedido."],
  ["Coordinamos el pago", `Te contactamos por WhatsApp para coordinar el pago (${STORE.payments.toLowerCase()}) y el envío.`],
  ["Te enviamos el pedido", "Una vez acreditado el pago, preparamos tu pedido y lo despachamos."],
];

export default function ComoComprar() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold tracking-widest uppercase">Cómo comprar</h1>
      <ol className="mt-8 space-y-6">
        {pasos.map(([titulo, texto], i) => (
          <li key={titulo} className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black text-sm font-bold text-white">{i + 1}</span>
            <div>
              <h2 className="font-semibold">{titulo}</h2>
              <p className="mt-1 text-neutral-700">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-neutral-700">
        ¿Preferís comprar en el local? Tenés que llevar un mínimo de {STORE.minItemsInStore} prendas.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/productos" className="inline-block bg-black px-6 py-3 text-xs font-bold tracking-widest text-white uppercase hover:bg-neutral-800">
          Ir a la tienda
        </Link>
        <Link href="/preguntas-frecuentes" className="inline-block border border-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white">
          Preguntas frecuentes
        </Link>
      </div>
    </div>
  );
}
