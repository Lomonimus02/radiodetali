import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  ChevronRight,
  Scale,
  Info,
  Phone,
} from "lucide-react";
import { getProductBySlug, getProducts, getCategoryBySlug, type UnitType } from "@/app/actions";
import { ProductCard, ProductGridSkeleton } from "../../../components";

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

// Получить суффикс единицы измерения для цены
function getPriceUnitSuffix(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM": return "/г.";
    case "KG": return "/кг.";
    default: return "/шт.";
  }
}

// Получить единицу измерения для описания
function getUnitLabel(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM": return "грамм";
    case "KG": return "килограмм";
    default: return "штуку";
  }
}

// Получить краткое название единицы
function getUnitShort(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM": return "1 г";
    case "KG": return "1 кг";
    default: return "1 шт";
  }
}

// Получить основную цену товара (первую доступную)
function getDisplayPrice(product: { priceNew: number | null; priceUsed: number | null }): number {
  return product.priceNew ?? product.priceUsed ?? 0;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const result = await getProductBySlug(productSlug);

  if (!result.success) {
    return {
      title: "Товар не найден",
    };
  }

  const product = result.data;
  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(getDisplayPrice(product));
  const unitLabel = getUnitLabel(product.unitType);

  return {
    title: `Продать ${product.name} - цена ${formattedPrice}`,
    description: `Актуальная цена на ${product.name} (${product.slug.toUpperCase()}) — ${formattedPrice} за ${unitLabel}. Скупка радиодеталей с драгметаллами: золото, серебро, платина, палладий. Быстрая оценка, оплата на месте.`,
    keywords: [
      product.name,
      product.slug,
      "скупка радиодеталей",
      "продать " + product.name,
      product.categoryName,
      "драгоценные металлы",
    ],
    openGraph: {
      title: `Продать ${product.name} - ${formattedPrice}`,
      description: `Скупаем ${product.name} по цене ${formattedPrice} за ${unitLabel}. Оценка драгметаллов, быстрая оплата.`,
      type: "website",
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

// Related products
async function RelatedProducts({
  categoryId,
  currentId,
  categorySlug,
}: {
  categoryId: string;
  currentId: string;
  categorySlug: string;
}) {
  const result = await getProducts({ categoryId, limit: 5 });

  if (!result.success) {
    return null;
  }

  const relatedProducts = result.data.filter((p) => p.id !== currentId);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 md:mt-16">
      <h2 className="text-xl md:text-2xl font-bold text-[var(--gray-900)] mb-6">
        Похожие товары
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {relatedProducts.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} categorySlug={categorySlug} />
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: categorySlug, productSlug } = await params;
  
  // Verify category exists
  const categoryResult = await getCategoryBySlug(categorySlug);
  if (!categoryResult.success) {
    notFound();
  }
  const category = categoryResult.data;
  
  const result = await getProductBySlug(productSlug);

  if (!result.success) {
    notFound();
  }

  const product = result.data;

  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(getDisplayPrice(product));

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-[var(--gray-200)]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-[var(--gray-500)] overflow-x-auto">
            <Link
              href="/"
              className="hover:text-[var(--primary-600)] whitespace-nowrap"
            >
              Главная
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link
              href="/catalog"
              className="hover:text-[var(--primary-600)] whitespace-nowrap"
            >
              Каталог
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link
              href={`/catalog/${categorySlug}`}
              className="hover:text-[var(--primary-600)] whitespace-nowrap"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-[var(--gray-900)] font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Back button - visible on all screens */}
        <Link
          href={`/catalog/${categorySlug}`}
          className="inline-flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в раздел «{category.name}»
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product image */}
          <div className="relative aspect-square bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-8"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-32 h-32 text-[var(--gray-300)]" />
              </div>
            )}
            {/* Category badge */}
            <span className="absolute top-4 left-4 px-3 py-1.5 bg-[var(--primary-900)]/90 text-white text-sm rounded-lg">
              {category.name}
            </span>
          </div>

          {/* Product info */}
          <div>
            {/* Title & marking */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--gray-900)] mb-2">
              {product.name}
            </h1>
            <p className="text-lg text-[var(--gray-500)] font-mono mb-6">
              Маркировка: {product.slug.toUpperCase()}
            </p>

            {/* Price block */}
            <div className="bg-gradient-to-r from-[var(--accent-50)] to-[var(--accent-100)] rounded-xl p-6 mb-6 border border-[var(--accent-200)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--gray-600)] mb-1">
                    Цена скупки за {getUnitShort(product.unitType)}
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-[var(--accent-700)] price-highlight">
                    {formattedPrice}{getPriceUnitSuffix(product.unitType)}
                  </p>
                  <p className="text-xs text-[var(--gray-500)] mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Цена рассчитана по актуальному курсу драгметаллов
                  </p>
                </div>
                <Scale className="w-12 h-12 text-[var(--accent-400)] shrink-0" />
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:+79001234567"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-xl font-semibold transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Позвонить
                </a>
                <Link
                  href="/contacts"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-700)] rounded-xl font-medium transition-colors"
                >
                  Все контакты
                </Link>
              </div>
            </div>

            {/* Additional info */}
            <div className="mt-6 p-4 bg-[var(--primary-50)] rounded-xl border border-[var(--primary-100)]">
              <h3 className="font-semibold text-[var(--primary-800)] mb-2">
                Как сдать эту деталь?
              </h3>
              <ol className="text-sm text-[var(--primary-700)] space-y-1 list-decimal list-inside">
                <li>Соберите все детали данного типа</li>
                <li>Свяжитесь с нами по телефону или форме обратной связи</li>
                <li>Привезите детали или закажите бесплатный выезд курьера</li>
                <li>Получите оплату сразу после оценки</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Related products */}
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <RelatedProducts
            categoryId={product.categoryId}
            currentId={product.id}
            categorySlug={categorySlug}
          />
        </Suspense>
      </div>
    </div>
  );
}
