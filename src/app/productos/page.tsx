import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export const metadata = { title: "Productos" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria, q } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: categoria, q }),
  ]);
  const current = categories.find((c) => c.slug === categoria);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-center text-2xl font-bold tracking-widest uppercase">
        {q ? `Resultados para “${q}”` : current?.name ?? "Todos los productos"}
      </h1>

      <div className="my-8 flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase">
        <Link href="/productos" className={`border px-3 py-1 ${!categoria ? "border-black bg-black text-white" : "border-neutral-300"}`}>
          Todos
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/productos?categoria=${c.slug}`}
            className={`border px-3 py-1 ${categoria === c.slug ? "border-black bg-black text-white" : "border-neutral-300"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-20 text-center text-neutral-500">No encontramos productos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
