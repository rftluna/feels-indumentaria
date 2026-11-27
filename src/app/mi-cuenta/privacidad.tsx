"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { STORE } from "@/lib/config";
import type { DatosCuenta } from "@/lib/use-sesion";

const boton = "cursor-pointer text-xs tracking-wider uppercase underline disabled:opacity-50";

/**
 * Derechos sobre los datos personales (Ley 25.326 / ISO 27701):
 * acceso (descargar mis datos) y supresión (eliminar mi cuenta).
 */
export function Privacidad({ user, datos }: { user: User; datos: DatosCuenta }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const descargar = async () => {
    setBusy(true);
    setMsg(null);
    const { data: pedidos, error } = await getSupabase()!
      .from("orders")
      .select("id, created_at, status, customer_name, customer_email, customer_phone, address, subtotal, discount, total, order_items(name, size, quantity, unit_price)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBusy(false);
    if (error) return setMsg("No pudimos preparar tus datos. Probá de nuevo en un rato.");
    const archivo = {
      tienda: STORE.name,
      exportado_en: new Date().toISOString(),
      cuenta: { email: user.email, creada_en: user.created_at, nombre: datos.nombre ?? null, telefono: datos.telefono ?? null, direccion: datos.direccion ?? null },
      pedidos: pedidos ?? [],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(archivo, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mis-datos-${STORE.shortName.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Listo: se descargó un archivo con tus datos y tus compras.");
  };

  const eliminar = async () => {
    const ok = window.confirm(
      "¿Eliminar tu cuenta?\n\n" +
      "Se borran tu email, tu contraseña y tus datos guardados, y no se puede deshacer.\n" +
      "Tus pedidos se conservan por obligaciones contables, pero dejan de estar asociados a una cuenta.",
    );
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    const sb = getSupabase()!;
    const { error } = await sb.rpc("eliminar_mi_cuenta");
    if (error) {
      setBusy(false);
      return setMsg(error.code === "P0001" ? error.message : "No pudimos eliminar la cuenta. Escribinos por WhatsApp y lo hacemos por vos.");
    }
    await sb.auth.signOut().catch(() => {});
    router.replace("/");
  };

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      <h2 className="mb-3 text-sm uppercase">Privacidad</h2>
      <p className="mb-3 text-xs text-neutral-600">Podés descargar una copia de tus datos o eliminar tu cuenta cuando quieras.</p>
      <div className="flex flex-col items-start gap-2">
        <button onClick={descargar} disabled={busy} className={boton}>Descargar mis datos</button>
        <button onClick={eliminar} disabled={busy} className={`${boton} text-red-700`}>Eliminar mi cuenta</button>
      </div>
      {msg && <p role="status" className="mt-3 text-xs text-neutral-700">{msg}</p>}
    </div>
  );
}
