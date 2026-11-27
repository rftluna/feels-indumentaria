export type Category = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  /** Categoría madre (null = categoría principal). Solo hay un nivel de subcategorías. */
  parent_id: number | null;
  /** false = oculta en la tienda (sigue visible en el panel) */
  visible: boolean;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number | null;
  sizes: string[];
  promo_label: string | null;
  promo_min_qty: number | null;
  promo_percent: number | null;
  stock: number;
  active: boolean;
};

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  size: string;
  quantity: number;
  promoMinQty: number | null;
  promoPercent: number | null;
};

export type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  address: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "pendiente" | "pagado" | "enviado" | "cancelado";
  created_at: string;
  order_items?: {
    id: number;
    name: string;
    size: string;
    unit_price: number;
    quantity: number;
  }[];
};
