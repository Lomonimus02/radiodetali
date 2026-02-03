import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/app/actions";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://radioskupka.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contacts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Страницы категорий и товаров
  const categoriesResult = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = [];
  const productPages: MetadataRoute.Sitemap = [];
  
  if (categoriesResult.success) {
    for (const category of categoriesResult.data) {
      // Category page
      categoryPages.push({
        url: `${BASE_URL}/catalog/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
      
      // Get products for this category
      const productsResult = await getProducts({ categoryId: category.id, limit: 500 });
      if (productsResult.success) {
        for (const product of productsResult.data) {
          productPages.push({
            url: `${BASE_URL}/catalog/${category.slug}/${product.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.7,
          });
        }
      }
    }
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
