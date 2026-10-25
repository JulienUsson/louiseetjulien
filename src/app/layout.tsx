import type { Metadata } from "next";
import localFont from "next/font/local";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = localFont({
  src: "./fonts/cormorant-garamond.woff2",
  variable: "--font-display",
  weight: "300 700",
});

const body = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-body",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Louise & Julien",
  description: "Le mariage de Louise & Julien",
  // Les pages invité contiennent un code personnel : elles ne doivent pas
  // se retrouver dans un index de moteur de recherche.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
