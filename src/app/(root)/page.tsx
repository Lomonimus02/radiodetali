import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Scale,
  Banknote,
  TrendingUp,
  Shield,
  Truck,
  Clock,
  Sparkles,
  Package,
  Recycle,
  Tag,
} from "lucide-react";
import { getCategoryShowcase } from "@/app/actions";
import { prisma } from "@/lib/prisma";

// Отключаем статический пререндеринг (требуется БД)
export const dynamic = "force-dynamic";

// Получить суффикс единицы измерения для цены
function getPriceUnitSuffix(unitType: "PIECE" | "GRAM" | "KG"): string {
  switch (unitType) {
    case "GRAM": return "/г.";
    case "KG": return "/кг.";
    default: return "/шт.";
  }
}

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(price);
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Premium gold accent gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10" />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.8'%3E%3Cpath d='M50 50m-40 0a40 40 0 1 0 80 0a40 40 0 1 0-80 0' stroke-width='0.5' stroke='%23fbbf24'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Надёжный партнёр с 2014 года
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
              ДРАГСОЮЗ
            </span>
          </h1>
          <h2 className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 max-w-2xl mx-auto font-medium">
            Скупка радиодеталей в СПб по высоким ценам
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Честная оценка, оплата сразу, работаем с физическими и юридическими лицами
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              Смотреть каталог
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-lg transition-all backdrop-blur-sm"
            >
              Связаться с нами
            </Link>
          </div>
          <div className="flex justify-center mt-4 sm:hidden">
            <Link
              href="/postal"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl font-medium text-sm text-white/80 hover:text-white transition-all backdrop-blur-sm"
            >
              <Truck className="w-4 h-4" />
              Почтовые отправления
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="var(--background)"
          />
        </svg>
      </div>
    </section>
  );
}

// Categories Section - 9 category blocks linking to category pages
async function CategoriesSection() {
  // Получаем только корневые категории (без подкатегорий)
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    take: 9,
    orderBy: { sortOrder: "asc" },
  });

  type CategoryType = typeof categories[number];

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Категории
            </h2>
            <p className="text-[var(--gray-600)] mt-2">
              Выберите тип радиодеталей
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden md:flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
          >
            Все категории
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid: 2 columns mobile, 9 columns desktop (1 row) */}
        <div className="grid grid-cols-2 xl:grid-cols-9 gap-3">
          {categories.map((category: CategoryType, index: number) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className={`group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 p-4 text-center ${index === 8 ? 'hidden xl:block' : ''}`}
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[var(--accent-100)] flex items-center justify-center group-hover:bg-[var(--accent-200)] transition-colors">
                <Package className="w-5 h-5 text-[var(--accent-600)]" />
              </div>
              <h3 className="font-semibold text-sm text-[var(--gray-900)] group-hover:text-[var(--primary-600)] transition-colors leading-tight">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>

        <Link
          href="/catalog"
          className="md:hidden flex items-center justify-center gap-2 mt-6 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
        >
          Все категории
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// Catalog Section - 10 cards with most expensive product per category (5 in a row)
async function CatalogSection() {
  const result = await getCategoryShowcase(10);

  if (!result.success || result.data.length === 0) {
    return null;
  }

  const showcaseItems = result.data;

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Каталог
            </h2>
            <p className="text-[var(--gray-600)] mt-2">
              Топовые позиции из каждой категории
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden md:flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
          >
            Все категории
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid: 1 column mobile, 3 md, 5 xl */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {showcaseItems.map((item) => (
            <Link
              key={item.id}
              href={`/catalog/${item.categorySlug}`}
              className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Product image */}
              <div className="relative aspect-square bg-[var(--gray-100)] overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-16 h-16 text-[var(--gray-300)]" />
                  </div>
                )}
                {/* Category label with gradient fade at top */}
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent pt-3 pb-10 px-3">
                  <span className="block text-white text-lg font-bold drop-shadow-md">
                    {item.categoryName}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Product name */}
                <h3 className="font-semibold text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors line-clamp-2 min-h-[2.5rem]">
                  {item.name}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-[var(--gray-500)] mb-5 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Prices */}
                <div className="space-y-1">
                  {item.priceNew !== null && (
                    <div className={`flex items-center justify-between px-2 py-1.5 rounded-md ${item.isSingleType ? 'bg-blue-50' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-1">
                        {item.isSingleType ? (
                          <Tag className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-green-600" />
                        )}
                        <span className={`text-xs font-medium ${item.isSingleType ? 'text-blue-700' : 'text-green-700'}`}>
                          {item.isSingleType ? 'Цена' : 'Новый'}
                        </span>
                      </div>
                      <span className={`font-bold ${item.isSingleType ? 'text-blue-700' : 'text-green-700'}`}>
                        {formatPrice(item.priceNew)}{getPriceUnitSuffix(item.unitType)}
                      </span>
                    </div>
                  )}
                  {item.priceUsed !== null && !item.isSingleType && (
                    <div className="flex items-center justify-between bg-amber-50 px-2 py-1.5 rounded-md">
                      <div className="flex items-center gap-1">
                        <Recycle className="w-3 h-3 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">Б/У</span>
                      </div>
                      <span className="font-bold text-amber-700">
                        {formatPrice(item.priceUsed)}{getPriceUnitSuffix(item.unitType)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/catalog"
          className="md:hidden flex items-center justify-center gap-2 mt-6 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
        >
          Все категории
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// Stats Section (moved from Hero)
function StatsSection() {
  const stats = [
    { value: "10+", label: "Лет опыта", icon: Clock },
    { value: "500+", label: "Позиций в каталоге", icon: TrendingUp },
    { value: "24ч", label: "Быстрая оценка", icon: Scale },
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-[var(--primary-800)] to-[var(--primary-900)]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 mb-4">
                <stat.icon className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
              </p>
              <p className="text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Benefits Section
function BenefitsSection() {
  const benefits = [
    {
      icon: Scale,
      title: "Честные весы",
      description:
        "Точное взвешивание на сертифицированном оборудовании при вас",
    },
    {
      icon: Banknote,
      title: "Оплата сразу",
      description: "Наличные или перевод на карту в момент сделки",
    },
    {
      icon: TrendingUp,
      title: "Актуальные цены",
      description: "Автоматический пересчёт по биржевому курсу металлов",
    },
    {
      icon: Shield,
      title: "Гарантия честности",
      description: "Работаем официально, предоставляем все документы",
    },
    {
      icon: Truck,
      title: "Выезд к клиенту",
      description: "Бесплатный выезд при крупных партиях деталей",
    },
    {
      icon: Clock,
      title: "Быстрая оценка",
      description: "Оценим вашу партию в течение 24 часов",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-[var(--gray-100)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
            Почему выбирают нас
          </h2>
          <p className="text-[var(--gray-600)] mt-2 max-w-2xl mx-auto">
            Мы работаем честно и прозрачно, предлагая лучшие условия на рынке
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-100)] text-[var(--accent-600)] flex items-center justify-center shrink-0">
                <benefit.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[var(--gray-600)]">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-r from-[var(--primary-800)] to-[var(--primary-900)]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Готовы сдать радиодетали?
        </h2>
        <p className="text-white/80 mb-8 max-w-xl mx-auto">
          Свяжитесь с нами для оценки вашей партии. Мы предложим лучшую цену!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#contacts"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] rounded-lg font-semibold text-lg text-white transition-colors"
          >
            Связаться с нами
          </Link>
          <a
            href="tel:+79001234567"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg font-semibold text-lg text-white transition-colors"
          >
            +7 (900) 123-45-67
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CatalogSection />
      <CategoriesSection />
      <StatsSection />
      <BenefitsSection />
      <CTASection />
    </>
  );
}
