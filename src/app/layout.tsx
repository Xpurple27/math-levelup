import type { Metadata } from "next";
import "./globals.css";
import "./c45.css";
import "./c45-hotfix.css";
import "./admin-content-polish.css";
import "./c46.css";
import "./c5-learning.css";
import "./c5-workflow.css";
import "./student-polish.css";
import "./vectra.css";
import "katex/dist/katex.min.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "VECTRA — Know Your Direction",
    template: "%s | VECTRA",
  },
  description:
    "Understand your ability, find your learning gaps, and know what to learn next with VECTRA Math.",
  applicationName: "VECTRA Math",
  keywords: ["VECTRA", "VECTRA Math", "UTBK", "SNBT", "matematika", "learning assessment", "diagnostic"],
  openGraph: {
    type: "website",
    siteName: "VECTRA",
    title: "VECTRA — Know Your Direction",
    description: "Know where you are. Know where to go next.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "VECTRA — Know Your Direction",
    description: "Know where you are. Know where to go next.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#content">
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
