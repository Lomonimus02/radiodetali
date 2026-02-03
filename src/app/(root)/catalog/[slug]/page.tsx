import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts } from "@/app/actions";
import { ProductGridSkeleton } from "../../components";
import { CategoryPageClient } from "./CategoryPageClient";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

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
    title: `${category.name} — Каталог радиодеталей`,
    description: `Скупка ${category.name.toLowerCase()} с драгоценными металлами. Актуальные цены, быстрая оценка, оплата на месте.`,
    keywords: [
      category.name,
      "скупка радиодеталей",
      "продать " + category.name.toLowerCase(),
      "драгоценные металлы",
    ],
  };
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
  );
}
