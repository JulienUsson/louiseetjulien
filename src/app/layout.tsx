import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
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
