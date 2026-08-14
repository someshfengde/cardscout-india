import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cardscout-india.pages.dev"),
  title: "CardScout India — Compare Credit Cards Without the Sales Pitch",
  description: "A source-backed, community-maintained directory of Indian credit cards, fees, rewards and benefits.",
  keywords: ["India credit cards", "credit card comparison", "cashback credit cards", "lifetime free credit cards", "RuPay credit cards"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "CardScout India — Compare Credit Cards Without the Sales Pitch",
    description: "Source-backed fees, rewards, lounge access and fine print across Indian credit cards.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "CardScout India credit card comparison" }],
  },
  twitter: { card: "summary_large_image", title: "CardScout India", description: "Compare Indian credit cards without the sales pitch.", images: ["/og.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
