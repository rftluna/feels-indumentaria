"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === 0;

  const onAdd = () => {
    if (!size) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image_url,
      size,
      quantity: qty,
      promoMinQty: product.promo_min_qty,
      promoPercent: product.promo_percent,
    });
    setAdded(true);
  };

  return (
    <div className="mt-8">
      <p className="mb-2 text-xs font-bold tracking-wider uppercase">Talle</p>
      <div className="flex gap-2">
        {product.sizes.map((s) => (
          <button
            key={s}
            onClick={() => { setSize(s); setAdded(false); }}
            className={`h-11 w-11 border text-sm font-semibold ${size === s ? "border-black bg-black text-white" : "border-neutral-300 hover:border-black"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex items-center border border-neutral-300">
          <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Restar">−</button>
          <span className="w-8 text-center">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Sumar">+</button>
        </div>
        <button
          onClick={onAdd}
          disabled={!size || outOfStock}
          className="flex-1 bg-black py-3 text-sm font-bold tracking-widest text-white uppercase disabled:bg-neutral-400"
        >
          {outOfStock ? "Sin stock" : size ? "Agregar al carrito" : "Elegí un talle"}
        </button>
      </div>

      {added && (
        <p className="mt-3 text-sm text-green-700">
          ¡Agregado! <Link href="/carrito" className="font-semibold underline">Ver carrito</Link>
        </p>
      )}
    </div>
  );
}
