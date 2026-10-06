import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "LevelUP Math — Langkah kecil. Kemajuan nyata.",
  description:
    "Tryout dan latihan matematika terarah untuk persiapan UTBK. Kenali kelemahan, pahami konsep, dan pantau progres.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
