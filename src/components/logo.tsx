import Link from "next/link";
import { STORE } from "@/lib/config";

/** Logo de Feels Indumentaria: "FEELS" grande y "INDUMENTARIA" espaciado debajo. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label={STORE.name} className={`flex flex-col items-center leading-none ${className}`}>
      <span className="font-logo text-3xl tracking-tight md:text-5xl">Feels</span>
      <span className="mt-1 text-[9px] font-bold tracking-[0.45em] uppercase md:text-[11px]">Indumentaria</span>
    </Link>
  );
}
