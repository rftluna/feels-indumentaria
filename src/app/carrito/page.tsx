"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { cartTotals } from "@/lib/cart-math";
import { formatPrice, STORE } from "@/lib/config";
import { getSupabase } from "@/lib/supabase";

export default function CartPage() {
  const { items, loaded, setQty, remove, clear } = useCart();
  const router = useRouter();
  const t = cartTotals(items);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const sb = getSupabase();
    let orderId: number;

    if (!sb) {
      orderId = Math.floor(Math.random() * 9000) + 1000; // modo demo
    } else {
      const { data, error } = await sb.rpc("create_order", {
        p_name: form.name,
        p_email: form.email,
        p_phone: form.phone,
        p_address: form.address,
        p_items: items.map((i) => ({ product_id: i.productId, size: i.size, quantity: i.quantity })),
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      orderId = data as number;
    }
    clear();
    router.push(`/gracias?orden=${orderId}`);
  };

  if (!loaded) return <p className="py-24 text-center text-neutral-500">Cargando carrito...</p>;

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold uppercase">Tu carrito está vacío</h1>
        <Link href="/productos" className="mt-6 inline-block bg-black px-8 py-3 text-xs font-bold tracking-widest text-white uppercase">
          Ver productos
        </Link>
      </div>
    );

  const missing = STORE.freeShippingFrom - (t.subtotal - t.discount);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1fr_380px]">
      <section>
        <h1 className="mb-6 text-2xl font-bold tracking-widest uppercase">Carrito</h1>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((i) => (
            <li key={`${i.productId}-${i.size}`} className="flex gap-4 py-4">
              <div className="relative h-28 w-20 shrink-0 bg-neutral-100">
                {i.image && <Image src={i.image} alt={i.name} fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/producto/${i.slug}`} className="font-semibold uppercase hover:underline">{i.name}</Link>
                <span className="text-sm text-neutral-500">Talle {i.size}</span>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center border border-neutral-300 text-sm">
                    <button className="px-2 py-1" onClick={() => setQty(i.productId, i.size, i.quantity - 1)}>−</button>
                    <span className="w-6 text-center">{i.quantity}</span>
                    <button className="px-2 py-1" onClick={() => setQty(i.productId, i.size, i.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => remove(i.productId, i.size)} className="text-xs text-neutral-500 underline">Quitar</button>
                </div>
              </div>
              <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {missing > 0 && (
          <p className="mt-4 text-sm">Te faltan <b>{formatPrice(missing)}</b> para tener envío gratis 🚚</p>
        )}
      </section>

      <aside className="h-fit border border-neutral-200 p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(t.subtotal)}</dd></div>
          {t.discount > 0 && (
            <div className="flex justify-between text-green-700"><dt>Descuento promo</dt><dd>−{formatPrice(t.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt>Envío</dt><dd>{t.shipping ? formatPrice(t.shipping) : "Gratis"}</dd></div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-bold"><dt>Total</dt><dd>{formatPrice(t.total)}</dd></div>
        </dl>

        <form onSubmit={checkout} className="mt-6 space-y-3">
          <h2 className="text-xs font-bold tracking-wider uppercase">Tus datos</h2>
          {([
            ["name", "Nombre y apellido", "text", true],
            ["email", "Email", "email", true],
            ["phone", "Teléfono", "tel", false],
            ["address", "Dirección de envío", "text", true],
          ] as const).map(([k, label, type, req]) => (
            <input
              key={k}
              type={type}
              required={req}
              placeholder={label}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
            />
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full bg-black py-3 text-sm font-bold tracking-widest text-white uppercase disabled:bg-neutral-400">
            {loading ? "Procesando..." : "Finalizar compra"}
          </button>
          <p className="text-center text-[11px] text-neutral-500">Proyecto demo: no se realiza ningún cobro real.</p>
        </form>
      </aside>
    </div>
  );
}
