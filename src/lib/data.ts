import { getSupabase } from "./supabase";
import { demoCategories, demoProducts } from "./demo-data";
import { PORTADA_DEFAULT } from "./imagenes";
import type { Category, Product } from "./types";

const toProduct = (p: Product): Product => ({ ...p, price: Number(p.price) });

export async function getCategories(): Promise<Category[]> {
  const sb = getSupabase();
  if (!sb) return demoCategories;
  const { data, error } = await sb.from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProducts(opts: { categorySlug?: string; q?: string; limit?: number } = {}): Promise<Product[]> {
  const sb = getSupabase();
  // Saneamos lo que llega por la URL: largo máximo y sin comodines de SQL (% _)
  if (opts.q) opts = { ...opts, q: opts.q.replace(/[%_\\]/g, "").trim().slice(0, 60) || undefined };
  if (opts.categorySlug && !/^[a-z0-9-]{1,60}$/.test(opts.categorySlug)) return [];

  if (!sb) {
    let list = demoProducts;
    if (opts.categorySlug) {
      const cat = demoCategories.find((c) => c.slug === opts.categorySlug);
      list = list.filter((p) => p.category_id === cat?.id);
    }
    if (opts.q) {
      const q = opts.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return opts.limit ? list.slice(0, opts.limit) : list;
  }

  // "!inner" hace un JOIN que permite filtrar por el slug de la categoría
  let query = opts.categorySlug
    ? sb.from("products").select("*, categories!inner(slug)").eq("categories.slug", opts.categorySlug)
    : sb.from("products").select("*");
  query = query.eq("active", true).order("id");
  if (opts.q) query = query.ilike("name", `%${opts.q}%`);
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
