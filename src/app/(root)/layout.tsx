import type { Metadata } from "next";
import { Header, Footer, TopAlert } from "./components";

export const metadata: Metadata = {
  title: {
    default: "ДРАГСОЮЗ — Скупка радиодеталей в СПб по высоким ценам",
    template: "%s | ДРАГСОЮЗ",
  },
  description:
    "Профессиональная скупка радиодеталей, содержащих драгоценные металлы. Транзисторы, конденсаторы, микросхемы, реле. Честные цены, быстрая оценка, оплата на месте.",
  keywords: [
    "скупка радиодеталей",
    "транзисторы",
    "конденсаторы",
    "микросхемы",
    "драгметаллы",
    "золото",
    "серебро",
    "палладий",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50">
        <TopAlert />
        <Header />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
