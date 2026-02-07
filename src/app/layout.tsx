import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
  themeColor: "#343a40",
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
    siteName: "ДРАГСОЮЗ",
    title: "ДРАГСОЮЗ — Скупка радиодеталей с драгметаллами",
    description:
      "Профессиональная скупка радиодеталей. Честные цены, быстрая оценка, оплата на месте.",
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
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
