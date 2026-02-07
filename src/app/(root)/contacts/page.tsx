import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  ChevronRight,
} from "lucide-react";
import { getGlobalSettings } from "@/app/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с нами для оценки радиодеталей. Телефон, WhatsApp, Telegram, адрес пункта приёма.",
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

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${CONTACTS.phoneRaw}?text=Здравствуйте, хочу узнать о скупке радиодеталей.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-green-400 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">WhatsApp</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  Написать в WhatsApp
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
