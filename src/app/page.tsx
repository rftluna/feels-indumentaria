import Image from "next/image";
import Link from "next/link";
import { getPortadaUrl, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60;

export default async function Home() {
  const [products, portada] = await Promise.all([getProducts({ limit: 8 }), getPortadaUrl()]);

  return (
    <>
      <section className="relative mx-auto h-[60vh] max-w-7xl overflow-hidden md:h-[75vh]">
        <Image
          src={portada}
          alt="Nueva colección"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
        <Link
          href="/productos"
          className="font-logo absolute bottom-12 left-1/2 -translate-x-1/2 border-b border-white/70 pb-1 text-4xl font-medium tracking-wide whitespace-nowrap text-white italic drop-shadow transition hover:border-white md:text-6xl"
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

    </>
  );
}
