import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Лист оценки",
  description:
    "Ваш список радиодеталей для сдачи. Актуальные цены, расчёт общей суммы, отправка заявки в VK.",
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
