/**
 * Price Calculator — расчёт цен на товары по содержанию драгоценных металлов
 * 
 * Система единиц измерения:
 * - Содержание металлов (content) — в миллиграммах (мг)
 * - Курсы металлов (rates) — цена за 1 мг
 * - Формула: Price = Content_MG * Rate_Per_MG (без деления на 1000)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Глобальные курсы металлов (из таблицы MetalRate)
 * Курсы хранятся как цена за 1 мг
 */
export interface MetalRates {
  gold: unknown;      // Prisma Decimal | number
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
}

/**
 * Кастомные курсы категории
 * Если курс задан (не null) — используется вместо глобального
 */
export interface CategoryCustomRates {
  customRateAu?: number | null;
  customRateAg?: number | null;
  customRatePt?: number | null;
  customRatePd?: number | null;
}

/**
 * Содержание металлов в товаре (в мг)
 */
export interface MetalContent {
  // Содержание для НОВЫХ товаров (мг)
  contentGold: unknown;
  contentSilver: unknown;
  contentPlatinum: unknown;
  contentPalladium: unknown;
  
  // Содержание для Б/У товаров (мг)
  contentGoldUsed: unknown;
  contentSilverUsed: unknown;
  contentPlatinumUsed: unknown;
  contentPalladiumUsed: unknown;
  
  // Флаги доступности
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  
  // Ручные цены (перебивают расчётные)
  manualPriceNew?: unknown | null;
  manualPriceUsed?: unknown | null;
  
  // Наценка товара (коэффициент: 0.9 = -10%, 1.0 = без наценки, 1.15 = +15%)
  priceMarkup?: number;
  
  // Тип товара: true = одна цена (без разделения Новое/Б/У)
  isSingleType?: boolean;
}

/**
 * Результат расчёта цены товара
 */
export interface ProductPrices {
  priceNew: number | null;   // null если isNewAvailable = false
  priceUsed: number | null;  // Для isSingleType = true: равен priceNew
  isSingleType: boolean;
}

/**
 * Разрешённые курсы металлов (после применения кастомных курсов категории)
 * Все курсы — цена за 1 мг
 */
export interface ResolvedRates {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
}

// ============================================================================
// RATE RESOLUTION
// ============================================================================

/**
 * Определяет итоговые курсы металлов для расчёта
 * 
 * Приоритет:
 * 1. Кастомный курс категории (customRateXx)
 * 2. Глобальный курс из MetalRate
 * 
 * @param globalRates - Глобальные курсы металлов
 * @param categoryRates - Кастомные курсы категории (опционально)
 * @returns Итоговые курсы для расчёта (цена за 1 мг)
 */
export function resolveRates(
  globalRates: MetalRates,
  categoryRates?: CategoryCustomRates | null
): ResolvedRates {
  return {
    gold: categoryRates?.customRateAu ?? Number(globalRates.gold),
    silver: categoryRates?.customRateAg ?? Number(globalRates.silver),
    platinum: categoryRates?.customRatePt ?? Number(globalRates.platinum),
    palladium: categoryRates?.customRatePd ?? Number(globalRates.palladium),
  };
}

// ============================================================================
// PRICE CALCULATION
// ============================================================================

/**
 * Рассчитывает базовую стоимость по содержанию металлов
 * 
 * Формула: Price = (Content_Au_MG * Rate_Au) + (Content_Ag_MG * Rate_Ag) + 
 *                  (Content_Pt_MG * Rate_Pt) + (Content_Pd_MG * Rate_Pd)
 * 
 * @param contentAu - Содержание золота (мг)
 * @param contentAg - Содержание серебра (мг)
 * @param contentPt - Содержание платины (мг)
 * @param contentPd - Содержание палладия (мг)
 * @param rates - Разрешённые курсы (цена за 1 мг)
 * @returns Базовая стоимость в рублях
 */
export function calculateBasePrice(
  contentAu: unknown,
  contentAg: unknown,
  contentPt: unknown,
  contentPd: unknown,
  rates: ResolvedRates
): number {
  const au = Number(contentAu) || 0;
  const ag = Number(contentAg) || 0;
  const pt = Number(contentPt) || 0;
  const pd = Number(contentPd) || 0;

  // Формула: Content_MG * Rate_Per_MG (без деления на 1000)
  const price =
    au * rates.gold +
    ag * rates.silver +
    pt * rates.platinum +
    pd * rates.palladium;

  return Math.round(price * 100) / 100;
}

/**
 * Рассчитывает цены товара
 * 
 * Алгоритм:
 * 1. Определяем курсы (customRate категории > глобальный курс)
 * 2. Рассчитываем базовую цену: Content_MG * Rate_Per_MG
 * 3. Применяем наценку товара: Base * priceMarkup
 * 4. Для isSingleType: считаем только по полям New, возвращаем одинаковую цену
 * 
 * @param product - Товар с содержанием металлов
 * @param globalRates - Глобальные курсы из MetalRate
 * @param categoryRates - Кастомные курсы категории
 * @returns Объект с ценами
 */
export function calculateProductPrices(
  product: MetalContent,
  globalRates: MetalRates,
  categoryRates?: CategoryCustomRates | null
): ProductPrices {
  const rates = resolveRates(globalRates, categoryRates);
  const markup = product.priceMarkup ?? 1.0;
  const isSingleType = product.isSingleType ?? false;

  // ========================================
  // Расчёт цены для "Новых"
  // ========================================
  let priceNew: number | null = null;
  
  // Для isSingleType всегда рассчитываем цену (игнорируем isNewAvailable)
  if (isSingleType || product.isNewAvailable) {
    if (product.manualPriceNew != null) {
      priceNew = Number(product.manualPriceNew);
    } else {
      const basePrice = calculateBasePrice(
        product.contentGold,
        product.contentSilver,
        product.contentPlatinum,
        product.contentPalladium,
        rates
      );
      priceNew = Math.round(basePrice * markup * 100) / 100;
    }
  }

  // ========================================
  // Расчёт цены для "Б/У"
  // ========================================
  let priceUsed: number | null = null;

  if (isSingleType) {
    // Для isSingleType: цена одинаковая (используем поля New)
    priceUsed = priceNew;
  } else if (product.isUsedAvailable) {
    if (product.manualPriceUsed != null) {
      priceUsed = Number(product.manualPriceUsed);
    } else {
      const basePrice = calculateBasePrice(
        product.contentGoldUsed,
        product.contentSilverUsed,
        product.contentPlatinumUsed,
        product.contentPalladiumUsed,
        rates
      );
      priceUsed = Math.round(basePrice * markup * 100) / 100;
    }
  }

  // Округляем итоговые цены до целых чисел
  return { 
    priceNew: priceNew !== null ? Math.round(priceNew) : null, 
    priceUsed: priceUsed !== null ? Math.round(priceUsed) : null, 
    isSingleType 
  };
}

/**
 * @deprecated Используйте calculateProductPrices
 */
export function calculateProductPrice(
  product: MetalContent,
  rates: MetalRates,
  categoryRates?: CategoryCustomRates | null
): number {
  const { priceNew, priceUsed } = calculateProductPrices(product, rates, categoryRates);
  return priceNew ?? priceUsed ?? 0;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Форматирует цену для отображения
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Форматирует содержание металла для отображения
 * @param content - Содержание в мг
 * @returns Отформатированная строка
 */
export function formatMetalContent(content: unknown): string {
  const value = Number(content);
  if (value === 0) return "—";
  
  // Форматируем в зависимости от величины
  if (value < 1) {
    return `${value.toFixed(4)} мг`;
  } else if (value < 10) {
    return `${value.toFixed(3)} мг`;
  } else if (value < 1000) {
    return `${value.toFixed(2)} мг`;
  }
  // Для значений >= 1000 мг показываем в граммах
  const grams = value / 1000;
  return `${grams.toFixed(3)} г`;
}
