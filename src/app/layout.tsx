import type { Metadata } from "next";
import { Archivo, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieBanner, WhatsAppButton } from "@/components/extras";
import { getCategories } from "@/lib/data";
import { STORE } from "@/lib/config";

const sans = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const logo = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${STORE.name} | Ropa oversize`, template: `%s | ${STORE.name}` },
  description: "Tienda online de ropa oversize: buzos, remeras, musculosas y shorts.",
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="es" className={`${sans.variable} ${logo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header categories={categories} />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
