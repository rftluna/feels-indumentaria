// ==========================================
// REGLAS DE SEGURIDAD: contraseñas, login y formularios
// ==========================================

export const PASSWORD_RULES = [
  { id: "largo", text: "Al menos 10 caracteres", ok: (p: string) => p.length >= 10 },
  { id: "letra", text: "Al menos una letra", ok: (p: string) => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(p) },
  { id: "numero", text: "Al menos un número", ok: (p: string) => /[0-9]/.test(p) },
  { id: "simbolo", text: "Al menos un símbolo (! @ # $ % & * ? .)", ok: (p: string) => /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(p) },
  { id: "espacios", text: "Sin espacios", ok: (p: string) => p.length > 0 && !/\s/.test(p) },
];

export const checkPassword = (p = "") => PASSWORD_RULES.map((r) => ({ id: r.id, text: r.text, ok: r.ok(p) }));
export const isStrongPassword = (p = "") => PASSWORD_RULES.every((r) => r.ok(p));

// ---------- Límite de intentos de login (en el navegador) ----------
// Se suma a los límites del lado del servidor que ya aplica Supabase Auth.
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
const KEY = "fields-login-attempts";

type AttemptState = { failed: number; lockedUntil: number };

const read = (): AttemptState => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "") as AttemptState;
  } catch {
    return { failed: 0, lockedUntil: 0 };
  }
};
const save = (s: AttemptState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
};

export const lockRemainingMs = () => {
  const { lockedUntil } = read();
  const rest = lockedUntil - Date.now();
  if (rest <= 0 && lockedUntil) save({ failed: 0, lockedUntil: 0 });
  return Math.max(0, rest);
};

/** Registra un intento fallido y devuelve cuántos quedan. */
export const registerFailedAttempt = () => {
  const failed = read().failed + 1;
  save({ failed, lockedUntil: failed >= MAX_ATTEMPTS ? Date.now() + LOCK_MINUTES * 60_000 : 0 });
  return MAX_ATTEMPTS - failed;
};

export const resetAttempts = () => save({ failed: 0, lockedUntil: 0 });

// ---------- Validación de formularios ----------
export const LIMITS = { name: 80, email: 120, phone: 25, address: 200 };
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_RE = /^[0-9 +()-]{6,25}$/;

/** Saca caracteres de control y espacios sobrantes. */
export const clean = (v: string, max: number) =>
  v.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);

/** Cierre de sesión automático del admin por inactividad */
export const ADMIN_IDLE_MINUTES = 30;
