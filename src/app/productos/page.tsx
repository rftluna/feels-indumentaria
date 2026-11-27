import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import { arbolCategorias } from "@/lib/categorias";
import { ProductCard } from "@/components/product-card";

export const metadata = { title: "Productos", description: "Todos los productos, novedades y ofertas. Promos comprando 2 o más." };

const chip = (activo: boolean) =>
  `border px-3 py-1 ${activo ? "border-black bg-black text-white" : "border-neutral-300 hover:border-black"}`;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; orden?: string; ofertas?: string }>;
}) {
  const { categoria, q, orden, ofertas } = await searchParams;
  const nuevos = orden === "nuevos";
  const soloOfertas = ofertas === "1";
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: categoria, q, nuevos, ofertas: soloOfertas }),
  ]);
  const arbol = arbolCategorias(categories);
  const current = categories.find((c) => c.slug === categoria);
  // Si la categoría elegida es una subcategoría, mostramos las "hermanas" de su categoría madre
  const madre = current && (current.parent_id === null ? current : categories.find((c) => c.id === current.parent_id));
  const subcategorias = madre ? arbol.find((c) => c.id === madre.id)?.hijas ?? [] : [];
  const titulo = q ? `Resultados para “${q}”` : current?.name ?? (nuevos ? "New in" : soloOfertas ? "Ofertas" : "Todos los productos");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-center text-2xl font-bold tracking-widest uppercase">{titulo}</h1>

      <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase">
        <Link href="/productos" className={chip(!categoria && !nuevos && !soloOfertas)}>Todos</Link>
        <Link href="/productos?orden=nuevos" className={chip(nuevos && !categoria)}>New in</Link>
        <Link href="/productos?ofertas=1" className={chip(soloOfertas && !categoria)}>Ofertas</Link>
        {arbol.map((c) => (
          <Link key={c.id} href={`/productos?categoria=${c.slug}`} className={chip(madre?.id === c.id)}>
            {c.name}
          </Link>
        ))}
      </div>
      {subcategorias.length > 0 && madre && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] uppercase">
          <Link href={`/productos?categoria=${madre.slug}`} className={chip(current?.id === madre.id)}>Ver todo {madre.name}</Link>
          {subcategorias.map((h) => (
            <Link key={h.id} href={`/productos?categoria=${h.slug}`} className={chip(current?.id === h.id)}>
              {h.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-20 text-center text-neutral-500">No encontramos productos.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
