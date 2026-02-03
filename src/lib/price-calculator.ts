/**
 * Интерфейс для курсов металлов
 * Поддерживает как Prisma Decimal, так и обычные числа
 */
export interface MetalRates {
  gold: unknown;
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
}

/**
 * Интерфейс для содержания металлов в товаре
 */
export interface MetalContent {
  // Содержание металлов для НОВЫХ товаров
  contentGold: unknown;
  contentSilver: unknown;
  contentPlatinum: unknown;
  contentPalladium: unknown;
  // Содержание металлов для Б/У товаров (меньше из-за скушенных ножек и т.д.)
  contentGoldUsed: unknown;
  contentSilverUsed: unknown;
  contentPlatinumUsed: unknown;
  contentPalladiumUsed: unknown;
  // Флаги доступности по состоянию
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  // Ручные цены для каждого состояния
  manualPriceNew?: unknown | null;
  manualPriceUsed?: unknown | null;
}

/**
 * Результат расчёта цены товара
 */
export interface ProductPrices {
  priceNew: number | null; // null если isNewAvailable = false
  priceUsed: number | null; // null если isUsedAvailable = false
}

/**
 * Рассчитывает базовую стоимость товара по содержанию металлов
 * 
 * Формула: Цена = (Содержание_Au * Курс_Au) + (Содержание_Ag * Курс_Ag) + 
 *                 (Содержание_Pt * Курс_Pt) + (Содержание_Pd * Курс_Pd)
 * 
 * @param contentGold - Содержание золота в граммах
 * @param contentSilver - Содержание серебра в граммах
 * @param contentPlatinum - Содержание платины в граммах
 * @param contentPalladium - Содержание палладия в граммах
 * @param rates - Текущие курсы металлов
 * @returns Базовая стоимость в рублях (без наценки)
 */
export function calculateBasePrice(
  contentGold: unknown,
  contentSilver: unknown,
  contentPlatinum: unknown,
  contentPalladium: unknown,
  rates: MetalRates
): number {
  // Конвертируем Decimal в number для расчётов
  const gold = Number(contentGold);
  const silver = Number(contentSilver);
  const platinum = Number(contentPlatinum);
  const palladium = Number(contentPalladium);

  const rateGold = Number(rates.gold);
  const rateSilver = Number(rates.silver);
  const ratePlatinum = Number(rates.platinum);
  const ratePalladium = Number(rates.palladium);

  // Формула расчёта цены
  const price =
    gold * rateGold +
    silver * rateSilver +
    platinum * ratePlatinum +
    palladium * ratePalladium;

  // Округляем до 2 знаков после запятой
  return Math.round(price * 100) / 100;
}

/**
 * Рассчитывает цены товара для обоих состояний (Новое / Б/У)
 * 
 * Алгоритм расчёта:
 * 1. Для НОВОГО: Рассчитать стоимость по contentGold/Silver/Platinum/Palladium
 * 2. Для Б/У: Рассчитать стоимость по contentGoldUsed/SilverUsed/PlatinumUsed/PalladiumUsed
 * 3. Применить priceMarkup к обеим стоимостям
 * 4. Если есть ручная цена (manualPriceNew/manualPriceUsed) — использовать её
 * 
 * @param product - Товар с содержанием металлов и настройками
 * @param rates - Текущие курсы металлов
 * @param priceMarkup - Глобальный коэффициент наценки (по умолчанию 1.0)
 * @returns Объект с ценами для каждого состояния
 */
export function calculateProductPrices(
  product: MetalContent,
  rates: MetalRates,
  priceMarkup: number = 1.0
): ProductPrices {
  // Расчёт цены для "Нового"
  let priceNew: number | null = null;
  if (product.isNewAvailable) {
    if (product.manualPriceNew != null) {
      priceNew = Number(product.manualPriceNew);
    } else {
      // Рассчитываем базовую стоимость для НОВЫХ по содержанию металлов
      const basePriceNew = calculateBasePrice(
        product.contentGold,
        product.contentSilver,
        product.contentPlatinum,
        product.contentPalladium,
        rates
      );
      priceNew = Math.round(basePriceNew * priceMarkup * 100) / 100;
    }
  }

  // Расчёт цены для "Б/У"
  let priceUsed: number | null = null;
  if (product.isUsedAvailable) {
    if (product.manualPriceUsed != null) {
      priceUsed = Number(product.manualPriceUsed);
    } else {
      // Рассчитываем базовую стоимость для Б/У по содержанию металлов Used
      const basePriceUsed = calculateBasePrice(
        product.contentGoldUsed,
        product.contentSilverUsed,
        product.contentPlatinumUsed,
        product.contentPalladiumUsed,
        rates
      );
      priceUsed = Math.round(basePriceUsed * priceMarkup * 100) / 100;
    }
  }

  return { priceNew, priceUsed };
}

/**
 * @deprecated Используйте calculateProductPrices для новой логики с двумя состояниями
 * Оставлено для обратной совместимости
 */
export function calculateProductPrice(
  product: MetalContent,
  rates: MetalRates,
  priceMarkup: number = 1.0
): number {
  const { priceNew, priceUsed } = calculateProductPrices(product, rates, priceMarkup);
  // Возвращаем первую доступную цену или 0
  return priceNew ?? priceUsed ?? 0;
}

/**
 * Форматирует цену для отображения
 * @param price - Цена в рублях
 * @returns Отформатированная строка с ценой
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Форматирует содержание металла для отображения
 * @param content - Содержание в граммах
 * @returns Отформатированная строка
 */
export function formatMetalContent(content: unknown): string {
  const value = Number(content);
  if (value === 0) return "—";
  
  // Для очень маленьких значений показываем больше знаков
  if (value < 0.001) {
    return `${value.toFixed(6)} г`;
  } else if (value < 0.01) {
    return `${value.toFixed(4)} г`;
  } else if (value < 1) {
    return `${value.toFixed(3)} г`;
  }
  return `${value.toFixed(2)} г`;
}
