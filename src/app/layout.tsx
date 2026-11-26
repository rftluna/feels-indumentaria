import type { Metadata } from "next";
import { Archivo, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieBanner, WhatsAppButton } from "@/components/extras";
import { getCategories } from "@/lib/data";
import { SITE_URL, STORE } from "@/lib/config";

const sans = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const logo = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"] });

const description = "Tienda online de ropa oversize: buzos, remeras, musculosas y shorts. Envíos a todo el país por Vía Cargo. Local en Av. Nazca 376, CABA.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE.name} | Ropa oversize`, template: `%s | ${STORE.name}` },
  description,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: STORE.name,
    title: `${STORE.name} | Ropa oversize`,
    description,
    images: [{ url: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200&h=630&fit=crop&q=70", width: 1200, height: 630, alt: STORE.name }],
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
