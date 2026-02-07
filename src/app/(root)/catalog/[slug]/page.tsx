import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts } from "@/app/actions";
import { ProductGridSkeleton } from "../../components";
import { CategoryPageClient } from "./CategoryPageClient";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://драгсоюз.рф";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug);

  if (!result.success) {
    return {
      title: "Категория не найдена",
    };
  }

  const category = result.data;

  return {
    title: `Скупка ${category.name} — цены за грамм/штуку | Драг Союз`,
    description: `Актуальные цены на ${category.name}. Принимаем лом драгметаллов дорого. Оценка по фото.`,
    keywords: [
      category.name,
      "скупка радиодеталей",
      "продать " + category.name.toLowerCase(),
      "драгоценные металлы",
      "цены на " + category.name.toLowerCase(),
    ],
    openGraph: {
      title: `Скупка ${category.name} — цены | Драг Союз`,
      description: `Актуальные цены на ${category.name}. Принимаем лом драгметаллов дорого.`,
      type: "website",
      url: `${BASE_URL}/catalog/${slug}`,
    },
  };
}

// JSON-LD Schema.org BreadcrumbList
function BreadcrumbSchema({ categoryName, categorySlug }: { categoryName: string; categorySlug: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: `${BASE_URL}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${BASE_URL}/catalog/${categorySlug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  const categoryResult = await getCategoryBySlug(slug);
  
  if (!categoryResult.success) {
    notFound();
  }
  
  const category = categoryResult.data;
  
  const productsResult = await getProducts({
    categoryId: category.id,
    limit: 200, // Load more products for dense grid
  });
  
  if (!productsResult.success) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD BreadcrumbList */}
      <BreadcrumbSchema categoryName={category.name} categorySlug={category.slug} />
      
      <Suspense fallback={<ProductGridSkeleton count={24} />}>
        <CategoryPageClient
          category={{
            id: category.id,
            name: category.name,
            slug: category.slug,
            warningMessage: category.warningMessage,
          }}
          products={productsResult.data}
          total={productsResult.total}
        />
      </Suspense>
    </>
  );
}
