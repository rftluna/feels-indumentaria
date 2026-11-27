import type { Category } from "./types";

export type NodoCategoria = Category & { hijas: Category[] };

/** Completa los campos nuevos si la base todavía no los tiene (falta correr supabase/categorias.sql). */
export function normalizarCategoria(c: Omit<Category, "parent_id" | "visible"> & Partial<Category>): Category {
  return { ...c, parent_id: c.parent_id ?? null, visible: c.visible ?? true };
}

const orden = (a: Category, b: Category) => a.sort_order - b.sort_order || a.id - b.id;

/**
 * Arma el árbol: categorías principales con sus subcategorías.
 * Con soloVisibles, se descartan las ocultas y las subcategorías de una madre oculta.
 */
export function arbolCategorias(cats: Category[], soloVisibles = true): NodoCategoria[] {
  const lista = soloVisibles ? cats.filter((c) => c.visible) : cats;
  return lista
    .filter((c) => c.parent_id === null)
    .sort(orden)
    .map((r) => ({ ...r, hijas: lista.filter((c) => c.parent_id === r.id).sort(orden) }));
}

/** IDs de una categoría y sus subcategorías (para mostrar todo lo de "Faldas" incluidas sus variantes). */
export function idsDeCategoria(cats: Category[], slug: string): number[] | null {
  const c = cats.find((x) => x.slug === slug);
  if (!c) return null;
  return [c.id, ...cats.filter((x) => x.parent_id === c.id).map((x) => x.id)];
}

/** "Pantalón Sastrero" -> "pantalon-sastrero" */
export function slugify(texto: string): string {
  const s = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return s || "categoria";
}

/** Slug que no choca con los existentes: "faldas", "faldas-2", ... */
export function slugUnico(nombre: string, existentes: string[]): string {
  const base = slugify(nombre);
  let slug = base;
  for (let i = 2; existentes.includes(slug); i++) slug = `${base}-${i}`;
  return slug;
}
