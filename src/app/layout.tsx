import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Базовый URL для генерации абсолютных ссылок (OG images, sitemap и т.д.)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://драгсоюз.рф";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#343a40",
  colorScheme: "dark light",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  title: {
    default: "ДРАГСОЮЗ — Скупка радиодеталей с драгметаллами",
    template: "%s | ДРАГСОЮЗ",
  },
  description:
    "Профессиональная скупка радиодеталей, содержащих драгоценные металлы: золото, серебро, платина, палладий. Честные цены по актуальному курсу, быстрая оценка, оплата на месте. Транзисторы, конденсаторы, микросхемы, реле.",
  keywords: [
    "скупка радиодеталей",
    "продать радиодетали",
    "скупка транзисторов",
    "скупка конденсаторов",
    "скупка микросхем",
    "драгоценные металлы",
    "золото в радиодеталях",
    "серебро в радиодеталях",
    "палладий",
    "платина",
  ],
  authors: [{ name: "ДРАГСОЮЗ" }],
  creator: "ДРАГСОЮЗ",
  publisher: "ДРАГСОЮЗ",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://драгсоюз.рф",
    siteName: "ДРАГСОЮЗ",
    title: "ДРАГСОЮЗ — Скупка радиодеталей с драгметаллами",
    description:
      "Профессиональная скупка радиодеталей. Честные цены, быстрая оценка, оплата на месте.",
  },
  alternates: {
    canonical: "https://драгсоюз.рф",
  },
  twitter: {
    card: "summary_large_image",
    title: "ДРАГСОЮЗ — Скупка радиодеталей",
    description:
      "Профессиональная скупка радиодеталей с драгоценными металлами",
  },
  verification: {
    // Добавьте свои коды верификации
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" style={{ backgroundColor: '#343a40' }}>
      <head>
        {/* Explicit theme-color for Telegram/iOS in-app browsers */}
        <meta name="theme-color" content="#343a40" />
        <meta name="msapplication-navbutton-color" content="#343a40" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
