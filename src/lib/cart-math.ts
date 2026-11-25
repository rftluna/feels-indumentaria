import { STORE } from "./config";
import type { CartItem } from "./types";

/** Mismo cálculo que la función SQL create_order (la base es la fuente de verdad). */
export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const qtyByProduct = new Map<number, { qty: number; item: CartItem }>();
  for (const i of items) {
    const prev = qtyByProduct.get(i.productId);
    qtyByProduct.set(i.productId, { qty: (prev?.qty ?? 0) + i.quantity, item: i });
  }

  let discount = 0;
  for (const { qty, item } of qtyByProduct.values()) {
    if (item.promoPercent && qty >= (item.promoMinQty ?? 1)) {
      discount += Math.round(item.price * qty * item.promoPercent) / 100;
    }
  }

  const afterDiscount = subtotal - discount;
  const shipping = items.length === 0 || afterDiscount >= STORE.freeShippingFrom ? 0 : STORE.shippingCost;
  return { subtotal, discount, shipping, total: afterDiscount + shipping };
}
