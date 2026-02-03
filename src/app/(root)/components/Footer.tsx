import Link from "next/link";
import { Zap, MapPin, Phone, Mail, Clock, MessageCircle, Send } from "lucide-react";

export function Footer() {
  return (
    <footer id="contacts" className="bg-[var(--gray-900)] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[var(--accent-500)] rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-wide">ДРАГСОЮЗ</span>
            </Link>
            <p className="text-[var(--gray-400)] text-sm leading-relaxed mb-4">
              Профессиональная скупка радиодеталей, содержащих драгоценные
              металлы. Честные цены, быстрая оценка, оплата на месте.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://wa.me/79001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-lg flex items-center justify-center transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/radioskupka"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-500 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-colors"
                title="Telegram"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Категории</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/catalog?category=tranzistory"
                className="text-[var(--gray-400)] hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                Транзисторы
              </Link>
              <Link
                href="/catalog?category=kondensatory"
                className="text-[var(--gray-400)] hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                Конденсаторы
              </Link>
              <Link
                href="/catalog?category=mikroshemy"
                className="text-[var(--gray-400)] hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                Микросхемы
              </Link>
              <Link
                href="/catalog?category=rele"
                className="text-[var(--gray-400)] hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                Реле
              </Link>
              <Link
                href="/catalog"
                className="text-[var(--accent-500)] hover:text-[var(--accent-400)] transition-colors text-sm font-medium"
              >
                Все категории →
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+79001234567"
                className="flex items-center gap-3 text-[var(--gray-400)] hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4 shrink-0 text-[var(--accent-500)]" />
                +7 (900) 123-45-67
              </a>
              <a
                href="https://wa.me/79001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[var(--gray-400)] hover:text-white transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4 shrink-0 text-green-500" />
                WhatsApp
              </a>
              <a
                href="https://t.me/radioskupka"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[var(--gray-400)] hover:text-white transition-colors text-sm"
              >
                <Send className="w-4 h-4 shrink-0 text-blue-400" />
                Telegram
              </a>
              <a
                href="mailto:info@radioskupka.ru"
                className="flex items-center gap-3 text-[var(--gray-400)] hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4 shrink-0 text-[var(--accent-500)]" />
                info@radioskupka.ru
              </a>
              <div className="flex items-start gap-3 text-[var(--gray-400)] text-sm">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent-500)]" />
                <span>г. Москва, ул. Примерная, д. 123</span>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Время работы</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-[var(--gray-400)] text-sm">
                <Clock className="w-4 h-4 shrink-0 text-[var(--accent-500)]" />
                <div>
                  <p>Пн-Пт: 9:00 - 18:00</p>
                  <p>Сб: 10:00 - 15:00</p>
                  <p>Вс: выходной</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/contacts"
                className="inline-block px-4 py-2 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] rounded-lg text-sm font-medium transition-colors"
              >
                Все контакты
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--gray-700)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--gray-500)]">
            <p>© 2026 ДРАГСОЮЗ. Все права защищены.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
