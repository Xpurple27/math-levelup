import type { Metadata } from "next";
import "./globals.css";
import "./c45.css";
import "./c45-hotfix.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "LevelUP Math — Belajar dengan arah",
  description:
    "Platform matematika UTBK untuk mengenali kelemahan, belajar terarah, berlatih, dan mengukur progres.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#content">Lewati ke konten</a>
        {children}
      </body>
    </html>
  );
}
