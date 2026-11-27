import Link from "next/link";
import { STORE } from "@/lib/config";

/** Logo de Feels Indumentaria: "FEELS" en serif y "INDUMENTARIA" espaciado debajo. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label={STORE.name} className={`flex flex-col items-center leading-none ${className}`}>
      <span className="font-logo text-4xl font-medium tracking-[0.22em] uppercase md:text-5xl">Feels</span>
      <span className="mt-1.5 text-[8px] font-normal tracking-[0.6em] uppercase md:text-[10px]">Indumentaria</span>
    </Link>
  );
}
