import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Las credenciales NUNCA van escritas en el código: vienen de variables de entorno
// (.env.local en tu PC, "Environment Variables" en Vercel). Ver .env.example.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Freno de seguridad: si por error se carga la clave "service_role" (que saltea
 * todas las reglas RLS) en una variable pública, la app se niega a arrancar.
 */
function assertPublicKey(key: string) {
  if (key.startsWith("sb_secret_")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY tiene una clave SECRETA. Usá la clave anon/publishable.");
  }
  const payload = key.split(".")[1];
  if (!payload) return; // formato nuevo "sb_publishable_..."
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (json.role === "service_role") {
      throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY tiene la clave service_role. Usá la clave anon.");
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("service_role")) throw e;
  }
}

if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  console.warn("NEXT_PUBLIC_SUPABASE_URL no parece una URL de Supabase válida.");
}
if (anonKey) assertPublicKey(anonKey);

/** true cuando las variables de entorno de Supabase están configuradas */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Cliente único (sirve en server y browser). null en modo demo. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}
