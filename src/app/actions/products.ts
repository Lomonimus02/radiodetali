"use server";

import { prisma } from "@/lib/prisma";
import { calculateProductPrices } from "@/lib/price-calculator";
import { revalidatePath } from "next/cache";

// ============================================================================
// ТИПЫ
// ============================================================================

/**
 * Фильтры для получения списка товаров
 */
export interface ProductFilters {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Единица измерения товара
 */
export type UnitType = "PIECE" | "GRAM" | "KG";

/**
 * Товар с рассчитанными ценами для API
 */
export interface ProductWithPrice {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  sortOrder: number;
  // Единица измерения (PIECE = шт, GRAM = г, KG = кг)
  unitType: UnitType;
  // Наценка на товар (коэффициент) для НОВОГО
  priceMarkup: number;
  // Наценка для Б/У товаров
  priceMarkupUsed: number;
  // Тип товара: true = одна цена (без разделения Новое/Б/У)
  isSingleType: boolean;
  // Цена по запросу
  isPriceOnRequest: boolean;
  // Содержание металлов для НОВЫХ
  contentGold: number;
  contentSilver: number;
  contentPlatinum: number;
  contentPalladium: number;
  // Содержание металлов для Б/У
  contentGoldUsed: number;
  contentSilverUsed: number;
  contentPlatinumUsed: number;
  contentPalladiumUsed: number;
  // Настройки доступности по состоянию
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  // Ручные цены
  manualPriceNew: number | null;
  manualPriceUsed: number | null;
  // Рассчитанные актуальные цены
  priceNew: number | null; // null если isNewAvailable = false
  priceUsed: number | null; // null если isUsedAvailable = false или isSingleType = true
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Входные данные для создания товара
 */
export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  categoryId: string;
  sortOrder?: number;
  // Единица измерения
  unitType?: UnitType;
  // Наценка и тип товара
  priceMarkup?: number;
  priceMarkupUsed?: number;
  isSingleType?: boolean;
  isPriceOnRequest?: boolean;
  // Содержание металлов для НОВЫХ
  contentGold?: number;
  contentSilver?: number;
  contentPlatinum?: number;
  contentPalladium?: number;
  // Содержание металлов для Б/У
  contentGoldUsed?: number;
  contentSilverUsed?: number;
  contentPlatinumUsed?: number;
  contentPalladiumUsed?: number;
  isNewAvailable?: boolean;
  isUsedAvailable?: boolean;
  manualPriceNew?: number | null;
  manualPriceUsed?: number | null;
}

/**
 * Входные данные для обновления товара
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  categoryId?: string;
  sortOrder?: number;
  // Единица измерения
  unitType?: UnitType;
  // Наценка и тип товара
  priceMarkup?: number;
  priceMarkupUsed?: number;
  isSingleType?: boolean;
  isPriceOnRequest?: boolean;
  // Содержание металлов для НОВЫХ
  contentGold?: number;
  contentSilver?: number;
  contentPlatinum?: number;
  contentPalladium?: number;
  // Содержание металлов для Б/У
  contentGoldUsed?: number;
  contentSilverUsed?: number;
  contentPlatinumUsed?: number;
  contentPalladiumUsed?: number;
  isNewAvailable?: boolean;
  isUsedAvailable?: boolean;
  manualPriceNew?: number | null;
  manualPriceUsed?: number | null;
}

/**
 * Результат операции со списком товаров
 */
export type ProductsResult =
  | { success: true; data: ProductWithPrice[]; total: number }
  | { success: false; error: string };

/**
 * Результат операции с одним товаром
 */
export type ProductResult =
  | { success: true; data: ProductWithPrice }
  | { success: false; error: string };

/**
 * Результат операции удаления
 */
export type DeleteResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================================
// ВНУТРЕННИЕ ТИПЫ
// ============================================================================

/** Товар из БД с включённой категорией */
interface DbProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  categoryId: string;
  category: {
    name: string;
    slug: string;
    // Кастомные курсы категории
    customRateAu: number | null;
    customRateAg: number | null;
    customRatePt: number | null;
    customRatePd: number | null;
  };
  sortOrder: number;
  // Единица измерения
  unitType: UnitType;
  // Наценка и тип товара
  priceMarkup: number;
  priceMarkupUsed: number;
  isSingleType: boolean;
  isPriceOnRequest: boolean;
  // Содержание металлов для НОВЫХ
  contentGold: unknown; // Prisma Decimal
  contentSilver: unknown;
  contentPlatinum: unknown;
  contentPalladium: unknown;
  // Содержание металлов для Б/У
  contentGoldUsed: unknown;
  contentSilverUsed: unknown;
  contentPlatinumUsed: unknown;
  contentPalladiumUsed: unknown;
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  manualPriceNew: unknown | null;
  manualPriceUsed: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Курсы для расчёта цены */
interface RatesForCalculation {
  gold: unknown;
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
}

// ============================================================================
// ХЕЛПЕРЫ
// ============================================================================

/**
 * Конвертирует Decimal-подобное значение в number
 */
function toNumber(value: unknown): number {
  return Number(value);
}

/**
 * Конвертирует Decimal-подобное значение в number или null
 */
function toNumberOrNull(value: unknown): number | null {
  return value !== null && value !== undefined ? Number(value) : null;
}

/**
 * Преобразует товар из БД в формат API с рассчитанными ценами
 */
function serializeProduct(
  product: DbProductWithCategory,
  rates: RatesForCalculation,
  globalPriceMarkup: number
): ProductWithPrice {
  // Наценка товара умножается на глобальную наценку (внутри priceMarkup товара)
  const effectiveMarkup = product.priceMarkup * globalPriceMarkup;
  const effectiveMarkupUsed = product.priceMarkupUsed * globalPriceMarkup;
  
  // Получаем кастомные курсы категории
  const categoryRates = {
    customRateAu: product.category.customRateAu,
    customRateAg: product.category.customRateAg,
    customRatePt: product.category.customRatePt,
    customRatePd: product.category.customRatePd,
  };
  
  const { priceNew, priceUsed } = calculateProductPrices(
    {
      contentGold: product.contentGold,
      contentSilver: product.contentSilver,
      contentPlatinum: product.contentPlatinum,
      contentPalladium: product.contentPalladium,
      contentGoldUsed: product.contentGoldUsed,
      contentSilverUsed: product.contentSilverUsed,
      contentPlatinumUsed: product.contentPlatinumUsed,
      contentPalladiumUsed: product.contentPalladiumUsed,
      isNewAvailable: product.isNewAvailable,
      isUsedAvailable: product.isUsedAvailable,
      manualPriceNew: product.manualPriceNew,
      manualPriceUsed: product.manualPriceUsed,
      priceMarkup: effectiveMarkup, // Используем эффективную наценку
      priceMarkupUsed: effectiveMarkupUsed, // Наценка для Б/У
      isSingleType: product.isSingleType,
    },
    rates,
    categoryRates // Передаём кастомные курсы категории
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    image: product.image,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    sortOrder: product.sortOrder,
    unitType: product.unitType,
    priceMarkup: product.priceMarkup,
    priceMarkupUsed: product.priceMarkupUsed,
    isSingleType: product.isSingleType,
    isPriceOnRequest: product.isPriceOnRequest,
    contentGold: toNumber(product.contentGold),
    contentSilver: toNumber(product.contentSilver),
    contentPlatinum: toNumber(product.contentPlatinum),
    contentPalladium: toNumber(product.contentPalladium),
    contentGoldUsed: toNumber(product.contentGoldUsed),
    contentSilverUsed: toNumber(product.contentSilverUsed),
    contentPlatinumUsed: toNumber(product.contentPlatinumUsed),
    contentPalladiumUsed: toNumber(product.contentPalladiumUsed),
    isNewAvailable: product.isNewAvailable,
    isUsedAvailable: product.isUsedAvailable,
    manualPriceNew: toNumberOrNull(product.manualPriceNew),
    manualPriceUsed: toNumberOrNull(product.manualPriceUsed),
    priceNew,
    priceUsed: product.isSingleType ? null : priceUsed, // Для единого типа Б/У цена не нужна
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/** Дефолтные курсы металлов */
const DEFAULT_RATES: RatesForCalculation = {
  gold: 6500,
  silver: 85,
  platinum: 3200,
  palladium: 3800,
};

/** Дефолтный коэффициент наценки */
const DEFAULT_MARKUP = 1.0;

/**
 * Получить текущие курсы или дефолтные
 */
async function getCurrentRates(): Promise<RatesForCalculation> {
  const rates = await prisma.metalRate.findUnique({
    where: { id: "current" },
  });

  if (!rates) {
    // Возвращаем дефолтные курсы, если запись не найдена
    return DEFAULT_RATES;
  }

  return rates;
}

/**
 * Получить текущий коэффициент наценки
 */
async function getPriceMarkup(): Promise<number> {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: "global" },
  });
  return settings?.priceMarkup ?? DEFAULT_MARKUP;
}

/**
 * Пересчитать sortOrder для всех товаров в категории после изменения позиции одного товара
 * @param categoryId - ID категории
 * @param movedProductId - ID перемещённого товара
 * @param newPosition - новая позиция (1-based)
 */
async function reorderProductsInCategory(
  categoryId: string,
  movedProductId: string,
  newPosition: number
): Promise<void> {
  // Получаем все товары категории, отсортированные по sortOrder
  const products = await prisma.product.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  // Удаляем перемещаемый товар из списка
  const otherProducts = products.filter(p => p.id !== movedProductId);
  
  // Вставляем его на новую позицию
  const movedProduct = products.find(p => p.id === movedProductId);
  if (!movedProduct) return;

  // Корректируем позицию в допустимых границах
  const clampedPosition = Math.max(1, Math.min(newPosition, products.length));
  
  // Вставляем на нужную позицию
  otherProducts.splice(clampedPosition - 1, 0, movedProduct);

  // Обновляем sortOrder для всех
  const updates = otherProducts.map((product, index) => 
    prisma.product.update({
      where: { id: product.id },
      data: { sortOrder: index + 1 },
    })
  );

  await Promise.all(updates);
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Получить список товаров с рассчитанными ценами
 */
export async function getProducts(
  filters?: ProductFilters
): Promise<ProductsResult> {
  try {
    const { categoryId, search, limit = 50, offset = 0 } = filters ?? {};

    // Формируем условия фильтрации
    const where: {
      categoryId?: string | { in: string[] };
      OR?: Array<{ name: { contains: string; mode: "insensitive" } } | { slug: { contains: string; mode: "insensitive" } }>;
    } = {};

    if (categoryId) {
      // Находим все подкатегории данной категории
      const subcategories = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      
      // Если есть подкатегории, включаем товары из них тоже
      if (subcategories.length > 0) {
        const categoryIds = [categoryId, ...subcategories.map(c => c.id)];
        where.categoryId = { in: categoryIds };
      } else {
        where.categoryId = categoryId;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // Получаем товары, курсы и наценку параллельно
    const [products, rates, priceMarkup, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
        take: limit,
        skip: offset,
      }),
      getCurrentRates(),
      getPriceMarkup(),
      prisma.product.count({ where }),
    ]);

    // Преобразуем товары с рассчитанными ценами
    const productsWithPrices = products.map((product: DbProductWithCategory) =>
      serializeProduct(product, rates, priceMarkup)
    );

    return {
      success: true,
      data: productsWithPrices,
      total,
    };
  } catch (error) {
    console.error("Ошибка при получении товаров:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить один товар по ID
 */
export async function getProductById(id: string): Promise<ProductResult> {
  try {
    const [product, rates, priceMarkup] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
            },
          },
        },
      }),
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    if (!product) {
      return {
        success: false,
        error: "Товар не найден",
      };
    }

    return {
      success: true,
      data: serializeProduct(product, rates, priceMarkup),
    };
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить товар по slug
 */
export async function getProductBySlug(slug: string): Promise<ProductResult> {
  try {
    const [product, rates, priceMarkup] = await Promise.all([
      prisma.product.findUnique({
        where: { slug },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
            },
          },
        },
      }),
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    if (!product) {
      return {
        success: false,
        error: "Товар не найден",
      };
    }

    return {
      success: true,
      data: serializeProduct(product, rates, priceMarkup),
    };
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Создать новый товар
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ProductResult> {
  try {
    console.log("=== createProduct input ===", JSON.stringify(input, null, 2));
    // Валидация обязательных полей
    if (!input.name?.trim()) {
      return { success: false, error: "Название товара обязательно" };
    }

    if (!input.slug?.trim()) {
      return { success: false, error: "Slug товара обязателен" };
    }

    if (!input.categoryId) {
      return { success: false, error: "Категория обязательна" };
    }

    // Проверяем уникальность slug
    const existingProduct = await prisma.product.findUnique({
      where: { slug: input.slug },
    });

    if (existingProduct) {
      return { success: false, error: "Товар с таким slug уже существует" };
    }

    // Проверяем существование категории
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      return { success: false, error: "Категория не найдена" };
    }

    // Автоматическое определение sortOrder если не указан или равен 0
    let sortOrder = input.sortOrder;
    if (!sortOrder || sortOrder <= 0) {
      // Находим максимальный sortOrder среди товаров ЭТОЙ ЖЕ категории
      const maxSortOrderResult = await prisma.product.aggregate({
        where: { categoryId: input.categoryId },
        _max: { sortOrder: true },
      });
      // Новый товар получает sortOrder = max + 1 (или 1 если товаров в категории нет)
      sortOrder = (maxSortOrderResult._max.sortOrder ?? 0) + 1;
    }

    // Создаём товар
    const product = await prisma.product.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description ?? null,
        image: input.image ?? null,
        categoryId: input.categoryId,
        sortOrder,
        // Единица измерения
        unitType: input.unitType ?? "PIECE",
        // Наценка и тип товара
        priceMarkup: input.priceMarkup ?? 1.0,
        priceMarkupUsed: input.priceMarkupUsed ?? 1.0,
        isSingleType: input.isSingleType ?? false,
        isPriceOnRequest: input.isPriceOnRequest ?? false,
        // Содержание металлов для НОВЫХ (обрабатываем null и NaN как 0)
        contentGold: (input.contentGold == null || Number.isNaN(input.contentGold)) ? 0 : input.contentGold,
        contentSilver: (input.contentSilver == null || Number.isNaN(input.contentSilver)) ? 0 : input.contentSilver,
        contentPlatinum: (input.contentPlatinum == null || Number.isNaN(input.contentPlatinum)) ? 0 : input.contentPlatinum,
        contentPalladium: (input.contentPalladium == null || Number.isNaN(input.contentPalladium)) ? 0 : input.contentPalladium,
        // Содержание металлов для Б/У (обрабатываем null и NaN как 0)
        contentGoldUsed: (input.contentGoldUsed == null || Number.isNaN(input.contentGoldUsed)) ? 0 : input.contentGoldUsed,
        contentSilverUsed: (input.contentSilverUsed == null || Number.isNaN(input.contentSilverUsed)) ? 0 : input.contentSilverUsed,
        contentPlatinumUsed: (input.contentPlatinumUsed == null || Number.isNaN(input.contentPlatinumUsed)) ? 0 : input.contentPlatinumUsed,
        contentPalladiumUsed: (input.contentPalladiumUsed == null || Number.isNaN(input.contentPalladiumUsed)) ? 0 : input.contentPalladiumUsed,
        isNewAvailable: input.isNewAvailable ?? true,
        isUsedAvailable: input.isUsedAvailable ?? true,
        manualPriceNew: input.manualPriceNew ?? null,
        manualPriceUsed: input.manualPriceUsed ?? null,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            customRateAu: true,
            customRateAg: true,
            customRatePt: true,
            customRatePd: true,
          },
        },
      },
    });

    const [rates, priceMarkup] = await Promise.all([
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    // Инвалидируем кеш
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return {
      success: true,
      data: serializeProduct(product, rates, priceMarkup),
    };
  } catch (error) {
    console.error("Ошибка при создании товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить товар
 */
export async function updateProduct(
  input: UpdateProductInput
): Promise<ProductResult> {
  try {
    console.log("=== updateProduct input ===", JSON.stringify(input, null, 2));
    if (!input.id) {
      return { success: false, error: "ID товара обязателен" };
    }

    // Проверяем существование товара
    const existingProduct = await prisma.product.findUnique({
      where: { id: input.id },
    });

    if (!existingProduct) {
      return { success: false, error: "Товар не найден" };
    }

    // Если меняется slug — проверяем уникальность
    if (input.slug && input.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: input.slug },
      });

      if (slugExists) {
        return { success: false, error: "Товар с таким slug уже существует" };
      }
    }

    // Если меняется категория — проверяем её существование
    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        return { success: false, error: "Категория не найдена" };
      }
    }

    // Формируем данные для обновления
    const updateData: {
      name?: string;
      slug?: string;
      image?: string | null;
      categoryId?: string;
      sortOrder?: number;
      // Единица измерения
      unitType?: UnitType;
      // Наценка и тип товара
      priceMarkup?: number;
      priceMarkupUsed?: number;
      isSingleType?: boolean;
      isPriceOnRequest?: boolean;
      // Содержание металлов для НОВЫХ
      contentGold?: number;
      contentSilver?: number;
      contentPlatinum?: number;
      contentPalladium?: number;
      // Содержание металлов для Б/У
      contentGoldUsed?: number;
      contentSilverUsed?: number;
      contentPlatinumUsed?: number;
      contentPalladiumUsed?: number;
      isNewAvailable?: boolean;
      isUsedAvailable?: boolean;
      manualPriceNew?: number | null;
      manualPriceUsed?: number | null;
      description?: string | null;
    } = {};

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.slug !== undefined) updateData.slug = input.slug.trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.image !== undefined) updateData.image = input.image;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    // Единица измерения
    if (input.unitType !== undefined) updateData.unitType = input.unitType;
    // Наценка и тип товара
    if (input.priceMarkup !== undefined) updateData.priceMarkup = input.priceMarkup;
    if (input.priceMarkupUsed !== undefined) updateData.priceMarkupUsed = input.priceMarkupUsed;
    if (input.isSingleType !== undefined) updateData.isSingleType = input.isSingleType;
    if (input.isPriceOnRequest !== undefined) updateData.isPriceOnRequest = input.isPriceOnRequest;
    // sortOrder обрабатывается отдельно через reorder
    // НОВЫЕ - обрабатываем null и NaN как 0
    if (input.contentGold !== undefined) updateData.contentGold = (input.contentGold == null || Number.isNaN(input.contentGold)) ? 0 : input.contentGold;
    if (input.contentSilver !== undefined) updateData.contentSilver = (input.contentSilver == null || Number.isNaN(input.contentSilver)) ? 0 : input.contentSilver;
    if (input.contentPlatinum !== undefined) updateData.contentPlatinum = (input.contentPlatinum == null || Number.isNaN(input.contentPlatinum)) ? 0 : input.contentPlatinum;
    if (input.contentPalladium !== undefined) updateData.contentPalladium = (input.contentPalladium == null || Number.isNaN(input.contentPalladium)) ? 0 : input.contentPalladium;
    // Б/У - обрабатываем null и NaN как 0
    if (input.contentGoldUsed !== undefined) updateData.contentGoldUsed = (input.contentGoldUsed == null || Number.isNaN(input.contentGoldUsed)) ? 0 : input.contentGoldUsed;
    if (input.contentSilverUsed !== undefined) updateData.contentSilverUsed = (input.contentSilverUsed == null || Number.isNaN(input.contentSilverUsed)) ? 0 : input.contentSilverUsed;
    if (input.contentPlatinumUsed !== undefined) updateData.contentPlatinumUsed = (input.contentPlatinumUsed == null || Number.isNaN(input.contentPlatinumUsed)) ? 0 : input.contentPlatinumUsed;
    if (input.contentPalladiumUsed !== undefined) updateData.contentPalladiumUsed = (input.contentPalladiumUsed == null || Number.isNaN(input.contentPalladiumUsed)) ? 0 : input.contentPalladiumUsed;
    if (input.isNewAvailable !== undefined) updateData.isNewAvailable = input.isNewAvailable;
    if (input.isUsedAvailable !== undefined) updateData.isUsedAvailable = input.isUsedAvailable;
    if (input.manualPriceNew !== undefined) updateData.manualPriceNew = input.manualPriceNew;
    if (input.manualPriceUsed !== undefined) updateData.manualPriceUsed = input.manualPriceUsed;

    // Обновляем товар
    const product = await prisma.product.update({
      where: { id: input.id },
      data: updateData,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            customRateAu: true,
            customRateAg: true,
            customRatePt: true,
            customRatePd: true,
          },
        },
      },
    });

    // Если изменился sortOrder — пересчитываем порядок всех товаров в категории
    if (input.sortOrder !== undefined && input.sortOrder !== existingProduct.sortOrder) {
      const categoryId = input.categoryId ?? existingProduct.categoryId;
      await reorderProductsInCategory(categoryId, input.id, input.sortOrder);
    }

    const [rates, priceMarkup] = await Promise.all([
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    const serialized = serializeProduct(product, rates, priceMarkup);
    console.log("=== updateProduct result ===", JSON.stringify({ isSingleType: serialized.isSingleType, priceNew: serialized.priceNew, priceUsed: serialized.priceUsed }, null, 2));

    // Инвалидируем кеш
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${existingProduct.slug}`);
    if (input.slug && input.slug !== existingProduct.slug) {
      revalidatePath(`/products/${input.slug}`);
    }

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Ошибка при обновлении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Удалить товар
 */
export async function deleteProduct(id: string): Promise<DeleteResult> {
  try {
    if (!id) {
      return { success: false, error: "ID товара обязателен" };
    }

    // Проверяем существование товара
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { success: false, error: "Товар не найден" };
    }

    // Удаляем товар
    await prisma.product.delete({
      where: { id },
    });

    // Инвалидируем кеш
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить товары по списку ID (для корзины)
 * Возвращает актуальные цены на момент запроса
 */
export async function getProductsByIds(ids: string[]): Promise<ProductsResult> {
  try {
    if (!ids.length) {
      return { success: true, data: [], total: 0 };
    }

    const [products, rates, priceMarkup] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: { in: ids },
        },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
            },
          },
        },
      }),
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    const productsWithPrices = products.map((product: DbProductWithCategory) =>
      serializeProduct(product, rates, priceMarkup)
    );

    return {
      success: true,
      data: productsWithPrices,
      total: productsWithPrices.length,
    };
  } catch (error) {
    console.error("Ошибка при получении товаров по ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить все slug товаров (для sitemap)
 */
export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const products = await prisma.product.findMany({
      select: { slug: true },
    });
    return products.map((p: { slug: string }) => p.slug);
  } catch (error) {
    console.error("Ошибка при получении slug товаров:", error);
    return [];
  }
}

/**
 * Результат поиска товара для редиректа
 */
export type SearchRedirectResult =
  | { success: true; categorySlug: string; productSlug: string }
  | { success: false; error: string };

/**
 * Найти наиболее подходящий товар по поисковому запросу
 * Возвращает slug категории и slug товара для редиректа
 */
export async function findBestMatchProduct(query: string): Promise<SearchRedirectResult> {
  try {
    if (!query.trim()) {
      return { success: false, error: "Пустой поисковый запрос" };
    }

    const searchQuery = query.trim();

    // Сначала ищем точное совпадение по slug
    const exactMatch = await prisma.product.findFirst({
      where: {
        slug: { equals: searchQuery, mode: "insensitive" },
      },
      include: {
        category: { select: { slug: true } },
      },
    });

    if (exactMatch) {
      return {
        success: true,
        categorySlug: exactMatch.category.slug,
        productSlug: exactMatch.slug,
      };
    }

    // Затем ищем частичное совпадение (приоритет slug, потом name)
    const partialMatch = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: { contains: searchQuery, mode: "insensitive" } },
          { name: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      include: {
        category: { select: { slug: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (partialMatch) {
      return {
        success: true,
        categorySlug: partialMatch.category.slug,
        productSlug: partialMatch.slug,
      };
    }

    return { success: false, error: "Товар не найден" };
  } catch (error) {
    console.error("Ошибка при поиске товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}
