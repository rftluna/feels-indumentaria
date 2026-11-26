import { STORE, shortPrice } from "@/lib/config";

// Preguntas frecuentes: [pregunta, respuesta]. Se usa en /preguntas-frecuentes y en /info.
export const faq: [string, string][] = [
  ["¿Tenés catálogo?", `Sí, pedilo por WhatsApp al ${STORE.whatsappLocal}.`],
  ["¿Dónde están ubicados?", `Estamos en ${STORE.address}.`],
  ["¿Qué horario atienden?", "Atendemos de lunes a sábado de 09:00 a 18:00 hs y los feriados de 10:00 a 16:00 hs."],
  ["¿Cuál es la compra mínima para envíos?", `La compra mínima para envíos es de ${shortPrice(STORE.minOrder)}.`],
  ["¿Cuál es la compra mínima en el local?", `En el local la compra mínima es de ${STORE.minItemsInStore} prendas.`],
  ["¿Cuáles son las formas de pago?", "Podés pagar en efectivo en el local o con transferencia."],
  ["¿Cómo hacen los envíos?", "Los envíos se hacen generalmente por Vía Cargo o por medio del transporte que prefieras. El costo del envío lo pagás directamente al transporte."],
  ["¿Hacen devoluciones?", "Las devoluciones se realizan solo por falla y por el mismo artículo."],
  ["¿Cómo elijo el talle?", "Las prendas son oversize: si preferís un calce más justo, elegí un talle menos."],
];
