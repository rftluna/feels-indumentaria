"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { clean, EMAIL_RE, LIMITS } from "@/lib/security";
import { Honeypot } from "@/components/honeypot";

export function WithdrawalForm() {
  const [form, setForm] = useState({ name: "", email: "", order: "", reason: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    // Honeypot: un humano nunca completa este campo oculto
    if (form.website) return setCode("ARR-000000");

    const name = clean(form.name, LIMITS.name);
    const email = clean(form.email, LIMITS.email).toLowerCase();
    const order = clean(form.order, 10);
    const reason = clean(form.reason, 500);
    if (name.length < 2) return setError("Ingresá tu nombre.");
    if (!EMAIL_RE.test(email)) return setError("Ingresá un email válido.");
    if (!/^\d{1,10}$/.test(order)) return setError("Ingresá el número de pedido (solo números).");

    setBusy(true);
    const sb = getSupabase();
    if (!sb) {
      setBusy(false);
      return setCode(`ARR-${String(Date.now()).slice(-6)} (modo demo)`);
    }
    const { data, error } = await sb.rpc("request_withdrawal", {
      p_name: name, p_email: email, p_order_id: Number(order), p_reason: reason,
    });
    setBusy(false);
    if (error) return setError(error.code === "P0001" ? error.message : "No pudimos registrar la solicitud. Probá de nuevo.");
    setCode(`ARR-${String(data).padStart(6, "0")}`);
  };

  if (code)
    return (
      <div className="mt-8 border border-black p-6">
        <p className="font-bold uppercase">Solicitud recibida</p>
        <p className="mt-2 text-sm">Tu código de seguimiento es <b>{code}</b>. Te contactamos por email dentro de las 24 horas.</p>
      </div>
    );

  const input = "w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black";
  return (
    <form onSubmit={submit} noValidate className="relative mt-8 space-y-3">
      <Honeypot value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <input placeholder="Nombre y apellido" maxLength={LIMITS.name} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
      <input type="email" placeholder="Email de la compra" maxLength={LIMITS.email} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
      <input inputMode="numeric" placeholder="Número de pedido" maxLength={10} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={input} />
      <textarea placeholder="Comentario (opcional)" maxLength={500} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={input} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="w-full bg-black py-3 text-sm font-bold tracking-widest text-white uppercase disabled:bg-neutral-400">
        {busy ? "Enviando..." : "Solicitar cancelación"}
      </button>
    </form>
  );
}
