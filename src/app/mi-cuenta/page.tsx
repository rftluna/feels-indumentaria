import { Suspense } from "react";
import { MiCuenta } from "./mi-cuenta";

export const metadata = {
  title: "Mi cuenta",
  description: "Ingresá o creá tu cuenta para ver tus compras y guardar tus datos.",
  robots: { index: false, follow: false },
};

export default function MiCuentaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* useSearchParams (para volver al carrito) necesita Suspense */}
      <Suspense fallback={<p className="text-neutral-500">Cargando...</p>}>
        <MiCuenta />
      </Suspense>
    </div>
  );
}
