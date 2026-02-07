import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Почтовые отправления | Сдать радиодетали по почте",
  description:
    "Отправьте радиодетали почтой или транспортной компанией. Прозрачная оценка, быстрый расчёт в день приёмки. Простой процесс в 3 шага.",
};

export default function PostalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
