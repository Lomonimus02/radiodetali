import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://драгсоюз.рф";

export const metadata: Metadata = {
  title: { absolute: "Отправить радиодетали почтой | Скупка по всей России | ДрагСоюз СПб" },
  description:
    "Сдайте радиодетали почтой или транспортной компанией по всей России. Прозрачная оценка по фото, быстрый расчёт в день приёмки. Компания ДрагСоюз СПб.",
  alternates: {
    canonical: `${BASE_URL}/postal`,
  },
};

export default function PostalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
