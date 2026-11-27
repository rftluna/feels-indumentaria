import { getSupabase } from "./supabase";
import { demoCategories, demoProducts } from "./demo-data";
import { PORTADA_DEFAULT } from "./imagenes";
import { idsDeCategoria, normalizarCategoria } from "./categorias";
import type { Category, Product } from "./types";

const toProduct = (p: Product): Product => ({ ...p, price: Number(p.price) });

export async function getCategories(): Promise<Category[]> {
  const sb = getSupabase();
  if (!sb) return demoCategories;
  const { data, error } = await sb.from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizarCategoria);
}

type FiltrosProductos = {
  categorySlug?: string;
  q?: string;
  limit?: number;
  /** Novedades: los últimos productos cargados primero */
  nuevos?: boolean;
  /** Solo productos con promoción */
  ofertas?: boolean;
};

export async function getProducts(opts: FiltrosProductos = {}): Promise<Product[]> {
  const sb = getSupabase();
  // Saneamos lo que llega por la URL: largo máximo y sin comodines de SQL (% _)
  if (opts.q) opts = { ...opts, q: opts.q.replace(/[%_\\]/g, "").trim().slice(0, 60) || undefined };
  if (opts.categorySlug && !/^[a-z0-9-]{1,60}$/.test(opts.categorySlug)) return [];

  // Una categoría incluye los productos de sus subcategorías
  let ids: number[] | null = null;
  if (opts.categorySlug) {
    ids = idsDeCategoria(await getCategories(), opts.categorySlug);
    if (!ids) return [];
  }

  if (!sb) {
    let list = demoProducts;
    if (ids) list = list.filter((p) => p.category_id !== null && ids.includes(p.category_id));
    if (opts.q) {
      const q = opts.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (opts.ofertas) list = list.filter((p) => p.promo_percent !== null);
    if (opts.nuevos) list = [...list].sort((a, b) => b.id - a.id);
    return opts.limit ? list.slice(0, opts.limit) : list;
  }

  let query = sb.from("products").select("*").eq("active", true);
  if (ids) query = query.in("category_id", ids);
  if (opts.ofertas) query = query.not("promo_percent", "is", null);
  if (opts.q) query = query.ilike("name", `%${opts.q}%`);
  query = opts.nuevos ? query.order("created_at", { ascending: false }).order("id", { ascending: false }) : query.order("id");
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(toProduct);
}

/** URL de la portada: la subida desde el panel (tabla site_images) o la foto original. */
export async function getPortadaUrl(): Promise<string> {
  const sb = getSupabase();
  if (!sb) return PORTADA_DEFAULT;
  // Si la tabla todavía no existe (falta correr supabase/fotos.sql) se usa la original.
  const { data } = await sb.from("site_images").select("url").eq("key", "portada").maybeSingle();
  return data?.url ?? PORTADA_DEFAULT;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = getSupabase();
  if (!sb) return demoProducts.find((p) => p.slug === slug) ?? null;
  const { data, error } = await sb.from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data) : null;
}
