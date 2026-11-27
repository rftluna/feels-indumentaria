import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieBanner, WhatsAppButton } from "@/components/extras";
import { getCategories } from "@/lib/data";
import { SITE_URL, STORE } from "@/lib/config";

// Jost (texto, liviana) + Cormorant Garamond (logo y títulos, serif elegante)
const sans = Jost({ variable: "--font-jost", weight: ["300", "400", "500", "600"], subsets: ["latin"] });
const logo = Cormorant_Garamond({ variable: "--font-cormorant", weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin"] });

const description = "Tienda online de moda femenina. Envíos a todo el país por Vía Cargo. Local en Av. Nazca 376, CABA.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE.name} | Moda femenina`, template: `%s | ${STORE.name}` },
  description,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: STORE.name,
    title: `${STORE.name} | Moda femenina`,
    description,
    images: [{ url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&h=630&fit=crop&q=70", width: 1200, height: 630, alt: STORE.name }],
  },
  twitter: { card: "summary_large_image" },
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
