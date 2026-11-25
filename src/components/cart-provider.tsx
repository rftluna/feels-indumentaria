"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartCtx = {
  items: CartItem[];
  loaded: boolean;
  count: number;
  add: (item: CartItem) => void;
  setQty: (productId: number, size: string, qty: number) => void;
  remove: (productId: number, size: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "slowdays-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratar desde localStorage
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const same = (a: CartItem, id: number, size: string) => a.productId === id && a.size === size;

  const value: CartCtx = {
    items,
    loaded,
    count: items.reduce((s, i) => s + i.quantity, 0),
    add: (item) =>
      setItems((prev) => {
        const found = prev.find((p) => same(p, item.productId, item.size));
        if (found)
          return prev.map((p) =>
            same(p, item.productId, item.size) ? { ...p, quantity: Math.min(20, p.quantity + item.quantity) } : p,
          );
        return [...prev, item];
      }),
    setQty: (id, size, qty) =>
      setItems((prev) =>
        prev.map((p) => (same(p, id, size) ? { ...p, quantity: Math.max(1, Math.min(20, qty)) } : p)),
      ),
    remove: (id, size) => setItems((prev) => prev.filter((p) => !same(p, id, size))),
    clear: () => setItems([]),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart debe usarse dentro de CartProvider");
  return c;
}
