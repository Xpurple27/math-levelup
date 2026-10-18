import type { Metadata, Viewport } from "next";
import { publicSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./c45.css";
import "./c45-hotfix.css";
import "./admin-content-polish.css";
import "./c46.css";
import "./c5-learning.css";
import "./c5-student-learning.css";
import "./c5-workflow.css";
import "./student-polish.css";
import "./vectra.css";
import "./vectra-hardening.css";
import "katex/dist/katex.min.css";

const siteUrl = publicSiteUrl();
const title = "VECTRA Math — Diagnostik, Latihan & Tryout UTBK Matematika";
const description =
  "Platform belajar UTBK matematika untuk mengetahui kemampuan, menemukan learning gap, belajar terarah, latihan soal, diagnostic, dan tryout dengan progress yang terukur.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1020",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | VECTRA Math",
  },
  description,
  applicationName: "VECTRA Math",
  creator: "VECTRA",
  publisher: "VECTRA",
  category: "education",
  keywords: [
    "VECTRA",
    "VECTRA Math",
    "UTBK",
    "SNBT",
    "UTBK matematika",
    "tryout UTBK",
    "latihan soal UTBK",
    "diagnostik matematika",
    "pengetahuan kuantitatif",
    "penalaran matematika",
  ],
  alternates: { canonical: siteUrl },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "VECTRA Math",
    title,
    description,
    url: siteUrl,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VECTRA Math — Know Your Direction" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VECTRA Math",
  alternateName: "VECTRA",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  description,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VECTRA Math",
  alternateName: "VECTRA",
  url: siteUrl,
  inLanguage: "id-ID",
  description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <a className="skip-link" href="#content">
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
