"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { clean, EMAIL_RE, isStrongPassword, LIMITS, PHONE_RE } from "@/lib/security";
import { PasswordChecklist } from "./auth-forms";
import { Honeypot } from "./honeypot";

const input = "w-full border border-neutral-300 px-3 py-2 outline-none focus:border-black";
const button = "w-full bg-black py-3 text-sm font-bold text-white uppercase disabled:bg-neutral-400";

/** Alta de cuenta de clienta. Si Supabase pide confirmar el email, avisa que revise su casilla. */
export function RegistroForm({ destino = "/mi-cuenta" }: { destino?: string }) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "", repetir: "", website: "" });
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);

  const cambiar = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.website) return; // honeypot: lo completó un bot
    const nombre = clean(form.nombre, LIMITS.name);
    const email = clean(form.email, LIMITS.email).toLowerCase();
    const telefono = clean(form.telefono, LIMITS.phone);
    if (nombre.length < 2) return setError("Ingresá tu nombre.");
    if (!EMAIL_RE.test(email)) return setError("Ingresá un email válido.");
    if (telefono && !PHONE_RE.test(telefono)) return setError("El teléfono solo puede tener números, espacios, +, - y paréntesis.");
    if (!isStrongPassword(form.password)) return setError("La contraseña no cumple los requisitos.");
    if (form.password !== form.repetir) return setError("Las contraseñas no coinciden.");
    if (!acepta) return setError("Para crear la cuenta tenés que aceptar los términos y la política de privacidad.");

    setBusy(true);
    setError("");
    const { data, error: err } = await getSupabase()!.auth.signUp({
      email,
      password: form.password,
      options: { data: { nombre, telefono }, emailRedirectTo: `${window.location.origin}${destino}` },
    });
    setBusy(false);
    if (err) {
      if (err.code === "signup_disabled") return setError("Por el momento no se pueden crear cuentas nuevas. Podés comprar igual sin cuenta.");
      if (err.status === 429) return setError("Demasiados intentos. Esperá unos minutos y probá de nuevo.");
      if (err.code === "weak_password") return setError("Elegí una contraseña más segura.");
      // Mensaje genérico: no revela si el email ya tiene cuenta
      return setError("No pudimos crear la cuenta. Si ya tenés una, ingresá o restablecé tu contraseña.");
    }
    // Con confirmación de email activada no hay sesión hasta que abra el link
    if (!data.session) setEnviado(email);
  };

  if (enviado)
    return (
      <div className="max-w-sm space-y-3 text-sm">
        <p className="text-base font-semibold">¡Casi listo!</p>
        <p>Te enviamos un mail a <b>{enviado}</b> para confirmar tu cuenta. Abrí el enlace (revisá también spam) y después ingresá con tu email y contraseña.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="relative max-w-sm space-y-3">
      <Honeypot value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
      <input required maxLength={LIMITS.name} autoComplete="name" placeholder="Nombre y apellido" value={form.nombre} onChange={cambiar("nombre")} className={input} />
      <input type="email" required maxLength={LIMITS.email} autoComplete="email" placeholder="Email" value={form.email} onChange={cambiar("email")} className={input} />
      <input type="tel" maxLength={LIMITS.phone} autoComplete="tel" placeholder="Teléfono (opcional)" value={form.telefono} onChange={cambiar("telefono")} className={input} />
      <input type="password" required maxLength={72} autoComplete="new-password" placeholder="Contraseña" value={form.password} onChange={cambiar("password")} className={input} />
      <PasswordChecklist value={form.password} />
      <input type="password" required maxLength={72} autoComplete="new-password" placeholder="Repetir contraseña" value={form.repetir} onChange={cambiar("repetir")} className={input} />
      <label className="flex items-start gap-2 text-xs text-neutral-600">
        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5" />
        <span>
          Acepto los <Link href="/info#terminos" className="underline">términos y condiciones</Link> y la{" "}
          <Link href="/info#privacidad" className="underline">política de privacidad</Link>.
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className={button}>{busy ? "Creando cuenta..." : "Crear cuenta"}</button>
    </form>
  );
}
