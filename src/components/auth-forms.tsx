"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  checkPassword,
  clean,
  EMAIL_RE,
  isStrongPassword,
  LIMITS,
  LOCK_MINUTES,
  lockRemainingMs,
  MAX_ATTEMPTS,
  registerFailedAttempt,
  resetAttempts,
} from "@/lib/security";

const input = "w-full border border-neutral-300 px-3 py-2 outline-none focus:border-black";
const button = "w-full bg-black py-3 text-sm font-bold text-white uppercase disabled:bg-neutral-400";
const RESEND_SECONDS = 60;

/**
 * Login con límite de intentos, mensajes genéricos y recuperación por mail.
 * `destino`: página a la que lleva el link del mail de recuperación (panel o Mi cuenta).
 */
export function Login({ destino = "/admin" }: { destino?: string }) {
  const [view, setView] = useState<"login" | "forgot" | "sent">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockMs, setLockMs] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer bloqueo guardado
    setLockMs(lockRemainingMs());
  }, []);

  // Cuenta regresiva del bloqueo y de la espera entre mails
  useEffect(() => {
    if (lockMs <= 0 && cooldown <= 0) return;
    const id = setInterval(() => {
      setLockMs(lockRemainingMs());
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [lockMs > 0, cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const locked = lockMs > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || busy) return;
    setBusy(true);
    setError("");
    const { error } = await getSupabase()!.auth.signInWithPassword({
      email: clean(email, LIMITS.email).toLowerCase(),
      password,
    });
    setBusy(false);
    if (!error) return resetAttempts();

    setPassword("");
    // Supabase solo lo devuelve si la contraseña es correcta pero falta confirmar el email
    if (error.code === "email_not_confirmed") {
      setError("Todavía no confirmaste tu email. Abrí el mail que te enviamos (revisá también spam) y volvé a intentar.");
      return;
    }
    if (error.status === 429) {
      setError("Demasiados intentos. Esperá unos minutos o restablecé tu contraseña.");
      return;
    }
    const left = registerFailedAttempt();
    if (left <= 0) {
      setLockMs(lockRemainingMs());
      setError(`Superaste los ${MAX_ATTEMPTS} intentos. El ingreso queda bloqueado ${LOCK_MINUTES} minutos.`);
    } else {
      // Mensaje genérico: no revela si falló el email o la contraseña
      setError(`Email o contraseña incorrectos. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.`);
    }
  };

  const forgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || busy) return;
    const value = clean(email, LIMITS.email).toLowerCase();
    if (!EMAIL_RE.test(value)) return setError("Ingresá un email válido.");
    setBusy(true);
    // A propósito no mostramos si el email existe o no
    await getSupabase()!.auth.resetPasswordForEmail(value, { redirectTo: `${window.location.origin}${destino}` });
    setBusy(false);
    setCooldown(RESEND_SECONDS);
    setView("sent");
  };

  if (view === "sent")
    return (
      <div className="max-w-sm space-y-3 text-sm">
        <p>Si el email corresponde a una cuenta, te llegará un enlace para crear una contraseña nueva.</p>
        <button disabled={cooldown > 0} onClick={() => setView("forgot")} className="underline disabled:text-neutral-400">
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar"}
        </button>
        <button onClick={() => setView("login")} className="block underline">Volver al ingreso</button>
      </div>
    );

  if (view === "forgot")
    return (
      <form onSubmit={forgot} className="max-w-sm space-y-3">
        <p className="text-sm text-neutral-600">Te enviamos un enlace para restablecer la contraseña.</p>
        <input type="email" required maxLength={LIMITS.email} autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy || cooldown > 0} className={button}>{cooldown > 0 ? `Esperá ${cooldown}s` : "Enviar enlace"}</button>
        <button type="button" onClick={() => setView("login")} className="text-sm underline">Volver</button>
      </form>
    );

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <input type="email" required maxLength={LIMITS.email} autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} disabled={locked} />
      <input type="password" required maxLength={72} autoComplete="current-password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className={input} disabled={locked} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy || locked} className={button}>
        {locked ? `Bloqueado ${Math.ceil(lockMs / 60000)} min` : busy ? "Ingresando..." : "Ingresar"}
      </button>
      <button type="button" onClick={() => { setError(""); setView("forgot"); }} className="text-sm underline">
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
}

export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="space-y-0.5 text-xs">
      {checkPassword(value).map((r) => (
        <li key={r.id} className={r.ok ? "text-green-700" : "text-neutral-500"}>{r.ok ? "✓" : "•"} {r.text}</li>
      ))}
    </ul>
  );
}

/**
 * Cambiar contraseña. Si `recovery` es true (llegó desde el mail de recuperación)
 * no pide la actual; si no, confirma la identidad con la contraseña actual primero.
 */
export function ChangePassword({ email, recovery = false, onDone }: { email: string; recovery?: boolean; onDone?: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(next)) return setMsg({ ok: false, text: "La contraseña nueva no cumple los requisitos." });
    if (next !== repeat) return setMsg({ ok: false, text: "Las contraseñas no coinciden." });
    if (!recovery && next === current) return setMsg({ ok: false, text: "La nueva tiene que ser distinta de la actual." });

    setBusy(true);
    const sb = getSupabase()!;
    if (!recovery) {
      // Reautenticación: confirmamos que quien cambia la clave conoce la actual
      const { error } = await sb.auth.signInWithPassword({ email, password: current });
      if (error) {
        setBusy(false);
        return setMsg({ ok: false, text: "La contraseña actual no es correcta." });
      }
    }
    const { error } = await sb.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "No se pudo cambiar la contraseña. Probá de nuevo." });
    setCurrent(""); setNext(""); setRepeat("");
    setMsg({ ok: true, text: "¡Contraseña actualizada!" });
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <h2 className="text-sm font-bold uppercase">{recovery ? "Creá tu contraseña nueva" : "Cambiar contraseña"}</h2>
      {!recovery && (
        <input type="password" required autoComplete="current-password" placeholder="Contraseña actual" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
      )}
      <input type="password" required maxLength={72} autoComplete="new-password" placeholder="Contraseña nueva" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
      <PasswordChecklist value={next} />
      <input type="password" required maxLength={72} autoComplete="new-password" placeholder="Repetir contraseña nueva" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} />
      {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={busy || !isStrongPassword(next) || next !== repeat} className={button}>Guardar</button>
    </form>
  );
}
