import Link from "next/link";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-logo text-7xl">404</p>
      <h1 className="mt-6 text-xl font-bold uppercase">Esta página se tomó el día libre</h1>
      <p className="mt-3 text-neutral-600">El enlace no existe o el producto ya no está disponible.</p>
      <Link href="/productos" className="mt-8 inline-block bg-black px-8 py-3 text-xs font-bold tracking-widest text-white uppercase">
        Ver productos
      </Link>
    </div>
  );
}
