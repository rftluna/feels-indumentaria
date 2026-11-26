import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data";
import { formatPrice, shortPrice, STORE } from "@/lib/config";
import { AddToCart } from "./add-to-cart";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  const description = `${product.description ?? product.name} · ${formatPrice(product.price)}`;
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.image_url ? [product.image_url] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
      <div className="relative aspect-[3/4] bg-neutral-100">
        {product.image_url && (
          <Image src={product.image_url} alt={product.name} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
        )}
      </div>

      <div>
        <Link href="/productos" className="text-xs text-neutral-500 uppercase hover:underline">← Volver a productos</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-wide uppercase">{product.name}</h1>
        <p className="mt-2 text-2xl">{formatPrice(product.price)}</p>
        {product.promo_label && (
          <p className="mt-3 inline-block bg-black px-2 py-1 text-xs font-bold text-white uppercase">
            {product.promo_label} comprando {product.promo_min_qty} o más
          </p>
        )}
        <p className="mt-6 text-neutral-700">{product.description}</p>

        <AddToCart product={product} />

        <ul className="mt-8 space-y-1 text-sm text-neutral-600">
          <li>🚚 Envíos por {STORE.shippingCarriers} (compra mínima {shortPrice(STORE.minOrder)})</li>
          <li>💵 {STORE.payments}</li>
          <li>🔁 Cambios solo por falla, por el mismo artículo</li>
        </ul>
      </div>
    </div>
  );
}
