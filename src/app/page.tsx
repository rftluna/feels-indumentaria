import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

export default async function Home() {
  const products = await getProducts({ limit: 8 });

  return (
    <>
      <section className="relative mx-auto h-[60vh] max-w-7xl overflow-hidden md:h-[75vh]">
        <Image
          src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=70"
          alt="Colección oversize"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
        <Link
          href="/productos"
          className="font-logo absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl text-white drop-shadow-lg transition hover:scale-105 md:text-6xl"
        >
          Shop now
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/productos" className="inline-block border border-black px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white">
            Ver todos los productos
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 text-center md:grid-cols-3">
        {[
          ["Enviamos tu compra", "Envíos gratis en compras +$10.000"],
          ["Chateá con nosotros", "Escribinos por WhatsApp con el botón verde"],
          ["Pagá como quieras", "Tarjetas de crédito o débito, efectivo o transferencia"],
        ].map(([t, d]) => (
          <div key={t} className="border border-neutral-200 p-6">
            <h3 className="font-bold tracking-wider uppercase">{t}</h3>
            <p className="mt-2 text-sm text-neutral-600">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
