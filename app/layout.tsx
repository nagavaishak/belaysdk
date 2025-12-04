import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BELAY - ML-Powered Transaction Optimization for Solana",
  description: "Never lose money on failed Solana transactions. BELAY uses machine learning and real-time network monitoring to optimize parameters and automatically retry failures. 99% target success rate.",
  keywords: ["Solana", "blockchain", "transaction optimization", "ML", "crypto", "DeFi", "Web3"],
  authors: [{ name: "BELAY Team" }],
  openGraph: {
    title: "BELAY - ML-Powered Transaction Optimization for Solana",
    description: "Never lose money on failed transactions. ML-powered optimization with 99% target success rate.",
    url: "https://belay.app",
    siteName: "BELAY",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BELAY - Transaction Optimization for Solana",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BELAY - ML-Powered Transaction Optimization for Solana",
    description: "Never lose money on failed transactions. 99% target success rate.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}