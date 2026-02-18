import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Bookmark Manager",
  description: "Save, organize, and access your bookmarks instantly — powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light', background: '#f7f7f5' }}>
      <body className={`${inter.variable} ${outfit.variable} antialiased`} style={{ background: '#f7f7f5', color: '#111111' }}>
        {children}
      </body>
    </html>
  );
}
