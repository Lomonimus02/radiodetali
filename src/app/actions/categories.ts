"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// ТИПЫ
// ============================================================================

/**
 * Данные категории для API
 */
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  warningMessage: string | null;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Входные данные для создания категории
 */
export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
  warningMessage?: string | null;
}

/**
 * Входные данные для обновления категории
 */
export interface UpdateCategoryInput {
  id: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  warningMessage?: string | null;
}

/**
 * Результат операции со списком категорий
 */
export type CategoriesResult =
  | { success: true; data: CategoryData[]; total: number }
  | { success: false; error: string };

/**
 * Результат операции с одной категорией
 */
export type CategoryResult =
  | { success: true; data: CategoryData }
  | { success: false; error: string };

/**
 * Результат операции удаления
 */
export type DeleteCategoryResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Пересчитать sortOrder для всех категорий с одинаковым parentId после изменения позиции одной
 * @param parentId - ID родительской категории (null для корневых)
 * @param movedCategoryId - ID перемещённой категории
 * @param newPosition - новая позиция (1-based)
 */
async function reorderCategoriesByParent(
  parentId: string | null,
  movedCategoryId: string,
  newPosition: number
): Promise<void> {
  // Получаем все категории с тем же parentId
  const categories = await prisma.category.findMany({
    where: { parentId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  // Удаляем перемещаемую категорию из списка
  const otherCategories = categories.filter(c => c.id !== movedCategoryId);
  
  // Вставляем её на новую позицию
  const movedCategory = categories.find(c => c.id === movedCategoryId);
  if (!movedCategory) return;

  // Корректируем позицию в допустимых границах
  const clampedPosition = Math.max(1, Math.min(newPosition, categories.length));
  
  // Вставляем на нужную позицию
  otherCategories.splice(clampedPosition - 1, 0, movedCategory);

  // Обновляем sortOrder для всех
  const updates = otherCategories.map((category, index) => 
    prisma.category.update({
      where: { id: category.id },
      data: { sortOrder: index + 1 },
    })
  );

  await Promise.all(updates);
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Получить список категорий
 * @param rootOnly - если true, возвращает только корневые категории (без подкатегорий)
 */
export async function getCategories(rootOnly: boolean = false): Promise<CategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      where: rootOnly ? { parentId: null } : undefined,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
        // Включаем подкатегории для подсчёта их товаров
        children: {
          select: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: rootOnly 
        ? { sortOrder: "asc" } 
        : [{ parentId: "asc" }, { sortOrder: "asc" }],
    });

    const data: CategoryData[] = categories.map((cat) => {
      // Считаем товары в категории + товары во всех подкатегориях
      const ownProducts = cat._count.products;
      const childrenProducts = cat.children?.reduce(
        (sum, child) => sum + child._count.products, 
        0
      ) ?? 0;
      
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        parentName: cat.parent?.name ?? null,
        sortOrder: cat.sortOrder,
        warningMessage: cat.warningMessage,
        productCount: ownProducts + childrenProducts,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    return {
      success: true,
      data,
      total: categories.length,
    };
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить категорию по slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryResult> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return { success: false, error: "Категория не найдена" };
    }

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        warningMessage: category.warningMessage,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении категории:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить категорию по ID
 */
export async function getCategoryById(id: string): Promise<CategoryResult> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return { success: false, error: "Категория не найдена" };
    }

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        warningMessage: category.warningMessage,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении категории:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Создать категорию
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<CategoryResult> {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "Название категории обязательно" };
    }

    if (!input.slug?.trim()) {
      return { success: false, error: "Slug категории обязателен" };
    }

    // Проверяем уникальность slug
    const existing = await prisma.category.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      return { success: false, error: "Категория с таким slug уже существует" };
    }

    // Если есть parentId — проверяем существование родителя
    if (input.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        return { success: false, error: "Родительская категория не найдена" };
      }
    }

    // Автоматическое определение sortOrder если не указан или равен 0
    let sortOrder = input.sortOrder;
    if (!sortOrder || sortOrder <= 0) {
      // Находим максимальный sortOrder среди категорий с тем же parentId
      const maxSortOrderResult = await prisma.category.aggregate({
        where: { parentId: input.parentId ?? null },
        _max: { sortOrder: true },
      });
      // Новая категория получает sortOrder = max + 1 (или 1 если категорий нет)
      sortOrder = (maxSortOrderResult._max.sortOrder ?? 0) + 1;
    }

    const category = await prisma.category.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        parentId: input.parentId ?? null,
        sortOrder,
        warningMessage: input.warningMessage?.trim() || null,
      },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        warningMessage: category.warningMessage,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("Ошибка при создании категории:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить категорию
 */
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<CategoryResult> {
  try {
    if (!input.id) {
      return { success: false, error: "ID категории обязателен" };
    }

    const existing = await prisma.category.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      return { success: false, error: "Категория не найдена" };
    }

    // Проверяем уникальность slug
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: input.slug },
      });
      if (slugExists) {
        return { success: false, error: "Категория с таким slug уже существует" };
      }
    }

    // Проверяем родителя
    if (input.parentId) {
      if (input.parentId === input.id) {
        return { success: false, error: "Категория не может быть родителем самой себя" };
      }
      const parent = await prisma.category.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        return { success: false, error: "Родительская категория не найдена" };
      }
    }

    // Формируем данные для обновления
    const updateData: {
      name?: string;
      slug?: string;
      warningMessage?: string | null;
      parent?: { connect: { id: string } } | { disconnect: true };
    } = {};
    
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.slug !== undefined) updateData.slug = input.slug.trim();
    if (input.warningMessage !== undefined) updateData.warningMessage = input.warningMessage?.trim() || null;
    
    // Обработка родительской категории через relation syntax
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        updateData.parent = { disconnect: true };
      } else {
        updateData.parent = { connect: { id: input.parentId } };
      }
    }
    // sortOrder обрабатывается отдельно через reorder

    const category = await prisma.category.update({
      where: { id: input.id },
      data: updateData,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    // Если изменился sortOrder — пересчитываем порядок всех категорий с тем же parentId
    if (input.sortOrder !== undefined && input.sortOrder !== existing.sortOrder) {
      const parentId = input.parentId !== undefined ? input.parentId : existing.parentId;
      await reorderCategoriesByParent(parentId, input.id, input.sortOrder);
    }

    revalidatePath("/admin/categories");
    revalidatePath("/");

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        warningMessage: category.warningMessage,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("Ошибка при обновлении категории:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Удалить категорию
 */
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  try {
    if (!id) {
      return { success: false, error: "ID категории обязателен" };
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return { success: false, error: "Категория не найдена" };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `Невозможно удалить категорию: в ней ${category._count.products} товар(ов)`,
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath("/admin/categories");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении категории:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

// ============================================================================
// ВИТРИНА КАТЕГОРИЙ (для главной страницы)
// ============================================================================

/**
 * Данные витрины для главной страницы
 * Содержит информацию о ТОВАРЕ (самом дорогом в категории) + slug категории для ссылки
 */
export interface CategoryShowcaseItem {
  // Данные ТОВАРА
  id: string;              // id товара
  name: string;            // название товара
  slug: string;            // slug товара
  image: string | null;    // фото товара
  priceNew: number | null; // цена товара (Новый)
  priceUsed: number | null;// цена товара (Б/У)
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  // Данные категории для ссылки
  categorySlug: string;    // slug категории
  categoryName: string;    // название категории
}

/**
 * Результат запроса витрины категорий
 */
export type CategoryShowcaseResult =
  | { success: true; data: CategoryShowcaseItem[] }
  | { success: false; error: string };

/**
 * Получить витрину категорий для главной страницы.
 * 
 * Алгоритм:
 * 1. Получает ВСЕ категории (отсортированные по sortOrder asc)
 * 2. Для КАЖДОЙ категории находит ОДИН товар с самой высокой ценой (priceNew desc)
 * 3. Пропускает категории без товаров
 * 4. Возвращает данные ТОВАРА (название, фото, цена) + categorySlug для ссылки
 * 
 * @param limit - максимальное количество результатов (по умолчанию 10)
 */
export async function getCategoryShowcase(limit: number = 10): Promise<CategoryShowcaseResult> {
  try {
    // Получаем курсы металлов и глобальные настройки для расчёта цен
    const [metalRates, globalSettings] = await Promise.all([
      prisma.metalRate.findFirst(),
      prisma.globalSettings.findFirst(),
    ]);

    // Если нет курсов металлов, расчёт цен невозможен
    if (!metalRates) {
      return { success: false, error: "Курсы металлов не настроены" };
    }

    const markup = globalSettings?.priceMarkup ? Number(globalSettings.priceMarkup) : 1;
    const markupUsed = markup; // Используем тот же коэффициент для Б/У товаров

    // Получаем только корневые категории с товарами (включая товары подкатегорий)
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        // Товары самой категории
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            // Содержание металлов для Новых
            contentGold: true,
            contentSilver: true,
            contentPlatinum: true,
            contentPalladium: true,
            // Содержание металлов для Б/У
            contentGoldUsed: true,
            contentSilverUsed: true,
            contentPlatinumUsed: true,
            contentPalladiumUsed: true,
            // Доступность
            isNewAvailable: true,
            isUsedAvailable: true,
            // Ручные цены
            manualPriceNew: true,
            manualPriceUsed: true,
          },
        },
        // Подкатегории с их товарами
        children: {
          select: {
            products: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                contentGold: true,
                contentSilver: true,
                contentPlatinum: true,
                contentPalladium: true,
                contentGoldUsed: true,
                contentSilverUsed: true,
                contentPlatinumUsed: true,
                contentPalladiumUsed: true,
                isNewAvailable: true,
                isUsedAvailable: true,
                manualPriceNew: true,
                manualPriceUsed: true,
              },
            },
          },
        },
      },
    });

    // Импортируем функцию расчёта цен
    const { calculateBasePrice } = await import("@/lib/price-calculator");

    const showcaseItems: CategoryShowcaseItem[] = [];

    for (const category of categories) {
      // Объединяем товары из категории и всех её подкатегорий
      const allProducts = [
        ...category.products,
        ...category.children.flatMap(child => child.products),
      ];

      // Пропускаем категории без товаров
      if (allProducts.length === 0) {
        continue;
      }

      // Рассчитываем цены для каждого товара и находим самый дорогой
      let maxEffectivePrice = -Infinity;
      let mostExpensiveProduct: typeof allProducts[0] | null = null;
      let bestPriceNew: number | null = null;
      let bestPriceUsed: number | null = null;

      for (const product of allProducts) {
        // Рассчитываем priceNew
        let priceNew: number | null = null;
        if (product.isNewAvailable) {
          if (product.manualPriceNew !== null) {
            priceNew = Number(product.manualPriceNew);
          } else {
            const basePrice = calculateBasePrice(
              product.contentGold,
              product.contentSilver,
              product.contentPlatinum,
              product.contentPalladium,
              metalRates
            );
            priceNew = Math.round(basePrice * markup * 100) / 100;
          }
        }

        // Рассчитываем priceUsed
        let priceUsed: number | null = null;
        if (product.isUsedAvailable) {
          if (product.manualPriceUsed !== null) {
            priceUsed = Number(product.manualPriceUsed);
          } else {
            const basePriceUsed = calculateBasePrice(
              product.contentGoldUsed,
              product.contentSilverUsed,
              product.contentPlatinumUsed,
              product.contentPalladiumUsed,
              metalRates
            );
            priceUsed = Math.round(basePriceUsed * markupUsed * 100) / 100;
          }
        }

        // Находим товар с максимальной ценой (priceNew или priceUsed - берём большую)
        const effectivePrice = Math.max(priceNew ?? 0, priceUsed ?? 0);
        if (effectivePrice > maxEffectivePrice) {
          maxEffectivePrice = effectivePrice;
          mostExpensiveProduct = product;
          bestPriceNew = priceNew;
          bestPriceUsed = priceUsed;
        }
      }

      // Добавляем товар в результат, если нашли (с любой ценой > 0)
      if (mostExpensiveProduct && maxEffectivePrice > 0) {
        showcaseItems.push({
          // Данные товара
          id: mostExpensiveProduct.id,
          name: mostExpensiveProduct.name,
          slug: mostExpensiveProduct.slug,
          image: mostExpensiveProduct.image,
          priceNew: bestPriceNew,
          priceUsed: bestPriceUsed,
          isNewAvailable: mostExpensiveProduct.isNewAvailable,
          isUsedAvailable: mostExpensiveProduct.isUsedAvailable,
          // Данные категории
          categorySlug: category.slug,
          categoryName: category.name,
        });
      }

      // Прерываем если достигли лимита
      if (showcaseItems.length >= limit) {
        break;
      }
    }

    return { success: true, data: showcaseItems };
  } catch (error) {
    console.error("Ошибка при получении витрины категорий:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}
