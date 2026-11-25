export const metadata = { title: "Información" };

const sections = [
  ["faq", "Preguntas frecuentes", "¿Cuánto tarda el envío? Entre 2 y 7 días hábiles según la zona. ¿Cómo elijo el talle? Nuestras prendas son oversize: si preferís un calce más justo, elegí un talle menos."],
  ["devoluciones", "Política de devolución", "Tenés 30 días desde que recibís tu compra para cambiarla. La prenda debe estar sin uso y con etiqueta."],
  ["terminos", "Términos y condiciones", "Este sitio es un proyecto de portfolio. Los productos, precios y pedidos son de demostración y no se realizan cobros reales."],
];

export default function Info() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-14">
      {sections.map(([id, title, text]) => (
        <section key={id} id={id} className="scroll-mt-40">
          <h2 className="text-xl font-bold tracking-wider uppercase">{title}</h2>
          <p className="mt-3 text-neutral-700">{text}</p>
        </section>
      ))}
    </div>
  );
}
