import Link from "next/link";

export const metadata = { title: "¡Gracias por tu compra!" };

export default async function Thanks({ searchParams }: { searchParams: Promise<{ orden?: string }> }) {
  const { orden: raw } = await searchParams;
  const orden = /^\d{1,10}$/.test(raw ?? "") ? raw : null; // solo aceptamos un número
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-logo text-5xl">¡Gracias!</p>
      <h1 className="mt-6 text-xl font-bold uppercase">Recibimos tu pedido{orden ? ` #${orden}` : ""}</h1>
      <p className="mt-3 text-neutral-600">Te vamos a escribir por email con los datos de pago y envío.</p>
      <p className="mt-3 text-sm text-neutral-600">
        Si compraste con tu cuenta, podés seguir el estado del pedido en{" "}
        <Link href="/mi-cuenta" className="underline">Mi cuenta</Link>.
      </p>
      <Link href="/productos" className="mt-8 inline-block bg-black px-8 py-3 text-xs font-bold tracking-widest text-white uppercase">
        Seguir comprando
      </Link>
    </div>
  );
}
