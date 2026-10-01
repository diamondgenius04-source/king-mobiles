import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/queries";
import { waLink, generalMessage } from "@/lib/whatsapp";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = s?.seo_title || "King Mobiles | Mobile Phones & Accessories in Nigeria";
  const description = s?.seo_description || "Shop iPhones, Samsung and Android phones, chargers, earphones and accessories from King Mobiles. Order easily on WhatsApp.";
  return {
    metadataBase: new URL(site),
    title: { default: title, template: "%s | King Mobiles" },
    description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: "King Mobiles", title, description, images: ["/og-image.png"], locale: "en_NG" },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
    icons: { icon: [{ url: "/favicon.ico" }, { url: "/icon-192.png", sizes: "192x192" }], apple: "/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const wa = waLink(generalMessage(), s?.whatsapp_number);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: "King Mobiles", url: site,
    telephone: s?.phone || s?.whatsapp_number, email: s?.email || undefined,
    address: s?.address ? { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "NG" } : undefined,
    sameAs: Object.values(s?.socials ?? {}),
  };
  return (
    <html lang="en-NG">
      <body className="bg-white text-slate-900 antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main">
            <a href="/" className="text-xl font-extrabold tracking-tight">King<span className="text-amber-500">Mobiles</span></a>
            <div className="flex items-center gap-5 text-sm font-medium">
              <a href="/products" className="hover:text-amber-600">Products</a>
              <a href="/contact" className="hover:text-amber-600">Contact</a>
              <a href={wa} className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">WhatsApp</a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 bg-slate-900 py-10 text-sm text-slate-300">
          <div className="mx-auto max-w-6xl px-4">© {new Date().getFullYear()} King Mobiles. {s?.address}</div>
        </footer>
        <a href={wa} aria-label="Chat with King Mobiles on WhatsApp"
           className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg hover:bg-emerald-700">💬</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
