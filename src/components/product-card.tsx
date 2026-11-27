import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/config";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        {product.promo_label && (
          <span className="absolute top-2 left-2 bg-rosa-100 px-2 py-1 text-[10px] leading-tight font-medium tracking-wider text-black uppercase">
            {product.promo_label}
            <br />
            comprando {product.promo_min_qty} o más
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1 text-center text-xs font-bold uppercase">Sin stock</span>
        )}
      </div>
      <h3 className="mt-3 text-center text-[13px] font-normal tracking-[0.12em] uppercase">{product.name}</h3>
      <p className="text-center text-sm">{formatPrice(product.price)}</p>
    </Link>
  );
}
