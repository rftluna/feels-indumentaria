import type { SupabaseClient } from "@supabase/supabase-js";

/** Bucket de Supabase Storage donde se guardan las fotos (ver supabase/fotos.sql) */
export const BUCKET = "fotos";

/** Portada que se muestra si todavía no se subió una desde el panel */
export const PORTADA_DEFAULT = "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=70";

const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_MB = 5;

/** Devuelve un mensaje de error si el archivo no sirve, o null si está bien. */
export function validarImagen(file: File): string | null {
  if (!TIPOS[file.type]) return "Subí una imagen JPG, PNG o WebP.";
  if (file.size > MAX_MB * 1024 * 1024) return `La imagen no puede pesar más de ${MAX_MB} MB.`;
  return null;
}

const MARCA = `/storage/v1/object/public/${BUCKET}/`;

/** Ruta dentro del bucket si la URL es una foto subida por el panel; null si es externa (ej. Unsplash). */
export function rutaDeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const i = url.indexOf(MARCA);
  return i === -1 ? null : decodeURIComponent(url.slice(i + MARCA.length));
}

/** Sube la foto a la carpeta indicada y devuelve su URL pública. */
export async function subirImagen(sb: SupabaseClient, file: File, carpeta: string): Promise<string> {
  const error = validarImagen(file);
  if (error) throw new Error(error);
  const ruta = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${TIPOS[file.type]}`;
  const { error: errSubida } = await sb.storage.from(BUCKET).upload(ruta, file, { contentType: file.type, cacheControl: "31536000" });
  if (errSubida) throw new Error("No pudimos subir la imagen. Probá de nuevo.");
  return sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

/** Borra del bucket una foto subida por el panel. Las URLs externas no se tocan. */
export async function borrarImagen(sb: SupabaseClient, url: string | null | undefined): Promise<void> {
  const ruta = rutaDeUrl(url);
  if (ruta) await sb.storage.from(BUCKET).remove([ruta]);
}
