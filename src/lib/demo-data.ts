// Datos usados solo si Supabase todavía no está configurado (modo demo).
// Son los mismos que supabase/seed.sql.
import type { Category, Product } from "./types";

export const demoCategories: Category[] = [
  { id: 1, slug: "remeras-oversize", name: "Remeras Oversize", sort_order: 1 },
  { id: 2, slug: "musculosas-oversize", name: "Musculosas Oversize", sort_order: 2 },
  { id: 3, slug: "buzos-oversize", name: "Buzos Oversize", sort_order: 3 },
  { id: 4, slug: "shorts", name: "Shorts", sort_order: 4 },
];

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80`;
const base = { sizes: ["S", "M", "L", "XL"], active: true };

export const demoProducts: Product[] = [
  { ...base, id: 1, slug: "buzo-oversize-gris", name: "Buzo Oversize Gris", description: "Buzo de frisa invisible, calce oversize, capucha doble y bolsillo canguro.", price: 7500, image_url: img("photo-1556821840-3a63f95609a7"), category_id: 3, promo_label: "5% OFF", promo_min_qty: 2, promo_percent: 5, stock: 25 },
  { ...base, id: 2, slug: "buzo-oversize-negro", name: "Buzo Oversize Negro", description: "Buzo negro de frisa premium, calce oversize.", price: 7500, image_url: img("photo-1578681994506-b8f463449011"), category_id: 3, promo_label: "5% OFF", promo_min_qty: 2, promo_percent: 5, stock: 25 },
  { ...base, id: 3, slug: "buzo-oversize-blanco", name: "Buzo Oversize Blanco", description: "Buzo blanco sin capucha, frisa premium.", price: 7500, image_url: img("photo-1620799140408-edc6dcb6d633"), category_id: 3, promo_label: "5% OFF", promo_min_qty: 2, promo_percent: 5, stock: 20 },
  { ...base, id: 4, slug: "remera-oversize-logo", name: "Remera Oversize Logo", description: "Remera negra de algodón peinado con logo bordado.", price: 3500, image_url: img("photo-1618354691373-d851c5c3a990"), category_id: 1, promo_label: "10% OFF", promo_min_qty: 2, promo_percent: 10, stock: 40 },
  { ...base, id: 5, slug: "remera-oversize-blanca", name: "Remera Oversize Blanca", description: "Remera blanca de algodón peinado 24/1.", price: 3500, image_url: img("photo-1521572163474-6864f9cf17ab"), category_id: 1, promo_label: "10% OFF", promo_min_qty: 2, promo_percent: 10, stock: 40 },
  { ...base, id: 6, slug: "remera-oversize-negra", name: "Remera Oversize Negra", description: "Remera de algodón peinado, cuello reforzado.", price: 3500, image_url: img("photo-1583743814966-8936f5b7be1a"), category_id: 1, promo_label: "10% OFF", promo_min_qty: 2, promo_percent: 10, stock: 40 },
  { ...base, id: 7, slug: "musculosa-oversize-negra", name: "Musculosa Oversize Negra", description: "Musculosa sisa ancha, algodón.", price: 2900, image_url: img("photo-1503342394128-c104d54dba01"), category_id: 2, promo_label: null, promo_min_qty: null, promo_percent: null, stock: 30 },
  { ...base, id: 8, slug: "short-de-jean", name: "Short de Jean", description: "Short de jean celeste con roturas.", price: 4200, image_url: img("photo-1591195853828-11db59a44f6b"), category_id: 4, promo_label: null, promo_min_qty: null, promo_percent: null, stock: 30 },
];
