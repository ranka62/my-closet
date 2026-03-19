import type { Metadata } from "next";
import { Playfair_Display, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Header from "@/components/Header";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "MyCloset",
  description: "AI Stylist & Digital Closet",
  manifest: "/manifest.json",
  themeColor: "#1c1917",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyCloset",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${playfair.variable} ${notoSansJP.variable} font-sans antialiased bg-stone-50 text-stone-800 min-h-screen flex flex-col selection:bg-stone-200 selection:text-stone-900`}
      >
        <Providers>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
