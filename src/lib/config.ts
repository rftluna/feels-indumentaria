export const STORE = {
  name: "SLOW DAYS",
  freeShippingFrom: 10000,
  shippingCost: 1500,
  // Número de WhatsApp en formato internacional sin "+" (cambialo por el tuyo)
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5491100000000",
  instagram: "https://instagram.com",
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n);
