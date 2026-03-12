import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ChevronRight,
} from "lucide-react";
import { getGlobalSettings } from "@/app/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с нами для оценки радиодеталей. Телефон, ВКонтакте, Telegram, адрес пункта приёма.",
};

// Дефолтные контактные данные
const DEFAULT_CONTACTS = {
  phone: "+7 (812) 983-49-76",
  phoneRaw: "+78129834976",
  email: "info@dragsoyuz.ru",
  telegram: "@dragsoyuz",
  address: "г. Санкт-Петербург",
  workSchedule: ["Пн-Пт: 10:00 - 18:00", "Сб: по записи", "Вс: выходной"],
  // Координаты для Яндекс Карт
  coordinates: {
    lat: 59.9343,
    lon: 30.3351,
  },
};

export default async function ContactsPage() {
  // Получаем данные из БД
  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  // Формируем контактные данные (с фолбеком на дефолты)
  const CONTACTS = {
    phone: settings?.phoneNumber || DEFAULT_CONTACTS.phone,
    phoneRaw: (settings?.phoneNumber || DEFAULT_CONTACTS.phoneRaw).replace(/[^\d+]/g, ""),
    email: settings?.email || DEFAULT_CONTACTS.email,
    telegram: settings?.telegramUsername 
      ? (settings.telegramUsername.startsWith("@") ? settings.telegramUsername : `@${settings.telegramUsername}`)
      : DEFAULT_CONTACTS.telegram,
    telegramUsername: (settings?.telegramUsername || "dragsoyuz").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""),
    address: settings?.address || DEFAULT_CONTACTS.address,
    workSchedule: settings?.workSchedule
      ? settings.workSchedule.split("\n").filter(line => line.trim())
      : DEFAULT_CONTACTS.workSchedule,
    coordinates: DEFAULT_CONTACTS.coordinates,
    storePhotoUrl: settings?.storePhotoUrl || null,
  };
  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-[var(--gray-200)]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-[var(--gray-500)]">
            <Link href="/" className="hover:text-[var(--primary-600)]">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--gray-900)] font-medium">Контакты</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--gray-900)] mb-4">
            Свяжитесь с нами
          </h1>
          <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
            Мы всегда рады помочь с оценкой ваших радиодеталей. Выберите удобный
            способ связи.
          </p>
        </div>

        {/* Store Photo */}
        {CONTACTS.storePhotoUrl && (
          <div className="mb-10 md:mb-14">
            <div className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={CONTACTS.storePhotoUrl}
                alt="Фото магазина"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Cards */}
          <div className="space-y-4">
            {/* Phone */}
            <a
              href={`tel:${CONTACTS.phoneRaw}`}
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--primary-400)] hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-[var(--primary-100)] rounded-full flex items-center justify-center shrink-0">
                <Phone className="w-7 h-7 text-[var(--primary-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">Телефон</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  {CONTACTS.phone}
                </p>
              </div>
            </a>

            {/* ВКонтакте */}
            <a
              href="https://vk.com/dragsoyuz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.547 7h-3.29a.743.743 0 0 0-.655.392s-1.312 2.416-1.734 3.23C14.734 12.813 14 12.126 14 11.11V7.603A1.104 1.104 0 0 0 12.896 6.5h-2.474a1.982 1.982 0 0 0-1.75.813s1.255-.204 1.255 1.49c0 .42.017 1.7.03 2.78a.664.664 0 0 1-1.082.57C7.63 10.719 6.633 8.36 6.633 8.36A.743.743 0 0 0 5.978 7H2.453a.742.742 0 0 0-.69 1.016s2.81 6.345 6.007 8.29c2.695 1.64 5.758 1.194 5.758 1.194h1.6a.742.742 0 0 0 .742-.742v-1.932a.742.742 0 0 1 1.265-.525l2.563 2.414a.742.742 0 0 0 .509.201h2.953a.742.742 0 0 0 .656-1.082s-2.159-2.352-2.563-2.828a.707.707 0 0 1 .09-.975c.476-.525 2.13-2.414 2.851-3.832A.742.742 0 0 0 21.547 7z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">ВКонтакте</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  Написать в VK
                </p>
              </div>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/${CONTACTS.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Send className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">Telegram</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  {CONTACTS.telegram}
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${CONTACTS.email}`}
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-[var(--accent-100)] rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-7 h-7 text-[var(--accent-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">Email</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  {CONTACTS.email}
                </p>
              </div>
            </a>
          </div>

          {/* Address & Map */}
          <div className="space-y-4">
            {/* Address Card */}
            <div className="p-6 bg-white rounded-xl border border-[var(--gray-200)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-[var(--gray-100)] rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7 text-[var(--gray-600)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--gray-500)] mb-1">Адрес</p>
                  <p className="text-xl font-semibold text-[var(--gray-900)]">
                    {CONTACTS.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[var(--gray-100)] rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7 text-[var(--gray-600)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--gray-500)] mb-1">
                    Время работы
                  </p>
                  {CONTACTS.workSchedule.map((line, index) => (
                    <p 
                      key={index} 
                      className={`font-medium ${index === CONTACTS.workSchedule.length - 1 ? "text-[var(--gray-500)]" : "text-[var(--gray-900)]"}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Yandex Map */}
            <div className="relative bg-[var(--gray-200)] rounded-xl overflow-hidden h-64 md:h-80">
              <iframe
                src={`https://yandex.ru/map-widget/v1/?ll=${CONTACTS.coordinates.lon}%2C${CONTACTS.coordinates.lat}&z=14&pt=${CONTACTS.coordinates.lon}%2C${CONTACTS.coordinates.lat}%2Cpm2rdm`}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0 }}
                title="Яндекс Карта - Драг Союз"
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-800)] rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Готовы сдать радиодетали?
          </h2>
          <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto">
            Позвоните нам или напишите в мессенджер — мы ответим на все вопросы
            и поможем с оценкой ваших деталей.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold rounded-lg transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
