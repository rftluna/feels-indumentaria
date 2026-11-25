import { WithdrawalForm } from "./withdrawal-form";

export const metadata = {
  title: "Botón de arrepentimiento",
  description: "Cancelá tu compra dentro de los 10 días corridos desde que la recibiste (Resolución 424/2020).",
};

export default function Arrepentimiento() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <h1 className="text-2xl font-bold tracking-widest uppercase">Botón de arrepentimiento</h1>
      <p className="mt-4 text-neutral-700">
        Tenés 10 días corridos desde que recibiste tu compra para cancelarla, sin dar motivos y sin costo
        (Ley 24.240 y Resolución 424/2020). Completá el formulario y te damos un código de seguimiento.
      </p>
      <WithdrawalForm />
    </div>
  );
}
