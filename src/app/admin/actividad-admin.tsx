"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Evento = {
  id: number;
  creado_en: string;
  actor_email: string | null;
  tabla: string;
  accion: "INSERT" | "UPDATE" | "DELETE";
  registro: string | null;
  detalle: Record<string, unknown> | null;
};

const TABLAS: Record<string, string> = {
  products: "Producto", categories: "Categoría", orders: "Pedido", withdrawals: "Arrepentimiento",
  admins: "Administradora", site_images: "Portada",
};
const ACCIONES = { INSERT: "Creó", UPDATE: "Modificó", DELETE: "Borró" };

/** Resumen legible de qué cambió */
function resumen(e: Evento): string {
  const d = e.detalle ?? {};
  if ("status_despues" in d) return `${d.status_antes ?? "—"} → ${d.status_despues ?? "(borrado)"}`;
  if (e.accion === "UPDATE")
    return Object.entries(d)
      .map(([k, v]) => (Array.isArray(v) && k !== "sizes" ? `${k}: ${String(v[0])} → ${String(v[1])}` : k))
      .join(" · ");
  return String(d.name ?? d.key ?? "");
}

/** Registro de actividad del panel (solo lectura). */
export function ActividadAdmin({ sb }: { sb: SupabaseClient }) {
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  const [falta, setFalta] = useState(false);

  useEffect(() => {
    sb.from("audit_log").select("*").order("creado_en", { ascending: false }).limit(100)
      .then(({ data, error }) => {
        setFalta(Boolean(error));
        setEventos((data as Evento[] | null) ?? []);
      });
  }, [sb]);

  if (eventos === null) return <p className="text-sm text-neutral-500">Cargando actividad...</p>;
  if (falta) return <p className="text-sm text-neutral-600">Para ver la actividad, corré <code>supabase/hardening.sql</code> en Supabase (SQL Editor).</p>;

  return (
    <div className="text-sm">
      <p className="mb-3 text-neutral-600">Últimos 100 cambios hechos desde el panel o directo en Supabase. Nadie puede editar ni borrar este registro desde la web.</p>
      {eventos.length === 0 ? (
        <p className="text-neutral-500">Todavía no hay actividad registrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b text-xs uppercase"><tr><th className="py-2">Fecha</th><th>Quién</th><th>Qué</th><th>Detalle</th></tr></thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id} className="border-b align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-xs">{new Date(e.creado_en).toLocaleString("es-AR")}</td>
                  <td className="pr-3 text-xs">{e.actor_email ?? "Supabase (directo)"}</td>
                  <td className="pr-3 whitespace-nowrap">{ACCIONES[e.accion]} {TABLAS[e.tabla] ?? e.tabla}{e.registro ? ` #${e.registro.slice(0, 8)}` : ""}</td>
                  <td className="text-xs text-neutral-600">{resumen(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
