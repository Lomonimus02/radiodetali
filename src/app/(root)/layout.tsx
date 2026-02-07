import type { Metadata } from "next";
import { Header, Footer, TopAlert } from "./components";
import { getGlobalSettings } from "@/app/actions";
import type { HeaderContactInfo } from "./components/Header";
import type { FooterContactInfo } from "./components/Footer";

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

// Хелпер для преобразования телефона в формат для href
function formatPhoneHref(phone: string): string {
  // Убираем все нецифровые символы кроме +
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// Хелпер для формирования ссылки на Telegram
function formatTelegramHref(username: string): string {
  // Убираем @ если есть и формируем ссылку
  const cleanUsername = username.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
  return `https://t.me/${cleanUsername}`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Получаем контактные данные из БД
  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  // Формируем данные для Header
  const headerContactInfo: HeaderContactInfo | undefined = settings ? {
    phoneNumber: settings.phoneNumber || "+7 (812) 983-49-76",
    phoneHref: formatPhoneHref(settings.phoneNumber || "+78129834976"),
    telegramHref: formatTelegramHref(settings.telegramUsername || "dragsoyuz"),
    workSchedule: settings.workSchedule?.split("\n")[0] || "Ежедневно с 10:00 до 20:00",
  } : undefined;

  // Формируем данные для Footer  
  const footerContactInfo: FooterContactInfo | undefined = settings ? {
    phone: settings.phoneNumber || "+7 (812) 983-49-76",
    phoneRaw: (settings.phoneNumber || "+78129834976").replace(/[^\d+]/g, ""),
    email: settings.email || "info@dragsoyuz.ru",
    telegram: (settings.telegramUsername || "dragsoyuz").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""),
    address: settings.address || "г. Санкт-Петербург",
    workSchedule: settings.workSchedule 
      ? settings.workSchedule.split("\n").filter(line => line.trim())
      : ["Пн-Пт: 10:00 - 18:00", "Сб: по записи", "Вс: выходной"],
  } : undefined;

  return (
    <div className="h-full flex flex-col bg-[var(--background)] overflow-y-auto overflow-x-hidden overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="sticky top-0 z-50 bg-[var(--gray-700)] shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <TopAlert />
        <Header contactInfo={headerContactInfo} />
      </div>
      <main className="flex-1">{children}</main>
      <Footer contactInfo={footerContactInfo} />
    </div>
  );
}
