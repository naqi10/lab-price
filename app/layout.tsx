import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DOMErrorSuppressor } from "@/components/dom-error-suppressor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lab Price Comparator",
  description:
    "Comparez les prix des analyses de laboratoire et générez des devis professionnels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <DOMErrorSuppressor />
        {children}
        {/* Dedicated portal root — all Radix/custom portals render here
            instead of document.body, preventing React 19 removeChild errors */}
        <div id="portal-root" />
      </body>
    </html>
  );
}
