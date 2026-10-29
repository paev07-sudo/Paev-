import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { RevealObserver } from "@/components/ui/reveal-observer";
import { club } from "@/content/club";
import { indexable, pageUrl, siteUrl } from "@/lib/site";
import "./globals.css";

const barlowCondensed = localFont({
  src: [
    { path: "../fonts/barlow-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/barlow-condensed-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
  fallback: ["Arial Narrow", "system-ui", "sans-serif"],
});

const barlow = localFont({
  src: [
    { path: "../fonts/barlow-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/barlow-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/barlow-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-barlow",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const description =
  "Villeneuve-Sports, club de football de Villeneuve VD fondé en 1921 : équipes actifs, juniors et juniores, match center, stade de la Tronchenaz et inscriptions.";

export const metadata: Metadata = {
  // Origin only: Next.js adds the base path to file-based metadata (icons, sharing image) itself.
  metadataBase: new URL(new URL(siteUrl).origin),
  title: {
    default: "Villeneuve-Sports — Football à Villeneuve VD depuis 1921",
    template: "%s · Villeneuve-Sports",
  },
  description,
  applicationName: "Villeneuve-Sports",
  keywords: ["Villeneuve-Sports", "FC Villeneuve-Sports", "football", "Villeneuve VD", "Tronchenaz", "ACVF", "juniors", "3e ligue"],
  openGraph: {
    type: "website",
    locale: "fr_CH",
    siteName: "Villeneuve-Sports",
    title: "Villeneuve-Sports — Football à Villeneuve VD depuis 1921",
    description,
    url: pageUrl("/"),
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: pageUrl("/") },
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#050b1f",
  colorScheme: "light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: club.name,
  alternateName: club.longName,
  sport: "Football",
  foundingDate: club.founded.iso,
  email: club.contact.email,
  url: siteUrl,
  sameAs: [club.contact.website, club.contact.facebook],
  memberOf: { "@type": "SportsOrganization", name: "Association cantonale vaudoise de football" },
  address: {
    "@type": "PostalAddress",
    postOfficeBoxNumber: "366",
    postalCode: "1844",
    addressLocality: "Villeneuve VD",
    addressCountry: "CH",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr-CH" className={`${barlowCondensed.variable} ${barlow.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available before first paint so reveal animations never hide content without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="fixed left-4 top-3 z-[60] -translate-y-24 rounded-[3px] bg-accent px-4 py-3 font-semibold text-night transition-transform focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <RevealObserver />
      </body>
    </html>
  );
}
