import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { getCategories } from "@/app/actions";
import { ProductGridSkeleton } from "../components";

export const metadata: Metadata = {
  title: "Каталог радиодеталей",
  description:
    "Полный каталог радиодеталей с актуальными ценами скупки. Транзисторы, конденсаторы, микросхемы, реле и другие детали.",
};

// Categories Grid
async function CategoriesGrid() {
  // Получаем только корневые категории (rootOnly = true)
  const result = await getCategories(true);

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--gray-500)]">
          Ошибка загрузки категорий: {result.error}
        </p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--gray-700)] mb-2">
          Категории не найдены
        </h3>
        <p className="text-[var(--gray-500)]">
          Категории еще не добавлены
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {result.data.map((category) => (
        <Link
          key={category.id}
          href={`/catalog/${category.slug}`}
          className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-100)] flex items-center justify-center group-hover:bg-[var(--accent-200)] transition-colors">
              <Package className="w-6 h-6 text-[var(--accent-600)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-[var(--gray-500)]">
                {category.productCount} {category.productCount === 1 ? 'товар' : category.productCount < 5 ? 'товара' : 'товаров'}
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--primary-600)] font-medium group-hover:underline">
            Открыть раздел →
          </p>
        </Link>
      ))}
    </div>
  );
}

export default async function CatalogPage() {
  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Page header */}
      <div className="bg-[var(--primary-900)] text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            Каталог радиодеталей
          </h1>
          <p className="text-white/70 mt-2">
            Актуальные цены скупки на основе курса драгоценных металлов
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-6">
          Выберите категорию
        </h2>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <CategoriesGrid />
        </Suspense>
      </div>
    </div>
  );
}
