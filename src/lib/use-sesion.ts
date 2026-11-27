"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/** Datos que guarda cada clienta en su cuenta (user_metadata de Supabase Auth) */
export type DatosCuenta = { nombre?: string; telefono?: string; direccion?: string };

/**
 * Sesión actual (clienta o administración), atenta a ingresos, salidas y al link
 * de "olvidé mi contraseña" (evento PASSWORD_RECOVERY).
 */
export function useSesion() {
  const [session, setSession] = useState<Session | null>(null);
  // Sin Supabase (modo demo) no hay nada que esperar
  const [lista, setLista] = useState(!isSupabaseConfigured);
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLista(true);
    });
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecuperando(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const datos = (session?.user.user_metadata ?? {}) as DatosCuenta;
  return { session, user: session?.user ?? null, datos, lista, recuperando, terminarRecuperacion: () => setRecuperando(false) };
}

/** true si la persona con sesión está en la tabla admins (la regla de la base solo le deja ver su propia fila) */
export function useEsAdmin(userId: string | undefined) {
  const [esAdmin, setEsAdmin] = useState(false);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    let vigente = true;
    sb.from("admins").select("user_id").eq("user_id", userId).maybeSingle()
      .then(({ data }) => vigente && setEsAdmin(Boolean(data)));
    return () => {
      vigente = false;
      setEsAdmin(false);
    };
  }, [userId]);
  return esAdmin && Boolean(userId);
}
