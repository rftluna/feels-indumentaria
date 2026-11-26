export const STORE = {
  name: "Feels Indumentaria",
  shortName: "Feels",
  freeShippingFrom: 10000,
  shippingCost: 1500,
  // Número de WhatsApp en formato internacional sin "+" (cambialo por el tuyo)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5491100000000",
  instagram: "https://www.instagram.com/textilfeels",
  // Dirección que se muestra en el mapa de "Dónde estamos" (cambiala por la real)
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS ?? "Buenos Aires, Argentina",
};

/** URL pública del sitio (Vercel la define sola en producción) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n);
