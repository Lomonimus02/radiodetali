"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================================================
// ТИПЫ
// ============================================================================

/**
 * Данные курсов металлов для API
 */
export interface MetalRatesData {
  id: string;
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  updatedAt: Date;
}

/**
 * Входные данные для обновления курсов
 */
export interface UpdateMetalRatesInput {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
}

/**
 * Результат операции с курсами
 */
export type MetalRatesResult =
  | { success: true; data: MetalRatesData }
  | { success: false; error: string };

/**
 * Данные глобальных настроек для API
 */
export interface GlobalSettingsData {
  id: string;
  priceMarkup: number; // Глобальный коэффициент наценки
  updatedAt: Date;
  // Контактные данные
  phoneNumber: string;
  email: string;
  telegramUsername: string;
  address: string;
  workSchedule: string;
}

/**
 * Входные данные для обновления глобальных настроек
 */
export interface UpdateGlobalSettingsInput {
  priceMarkup?: number;
  phoneNumber?: string;
  email?: string;
  telegramUsername?: string;
  address?: string;
  workSchedule?: string;
}

/**
 * Результат операции с глобальными настройками
 */
export type GlobalSettingsResult =
  | { success: true; data: GlobalSettingsData }
  | { success: false; error: string };

// ============================================================================
// ДЕФОЛТНЫЕ ЗНАЧЕНИЯ
// ============================================================================

const DEFAULT_RATES = {
  gold: 6500,
  silver: 85,
  platinum: 3200,
  palladium: 3800,
};

// ============================================================================
// ХЕЛПЕРЫ
// ============================================================================

/**
 * Преобразует запись из БД в формат для API
 * Конвертирует Decimal-подобные значения в number
 */
function serializeMetalRates(rates: {
  id: string;
  gold: unknown;
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
  updatedAt: Date;
}): MetalRatesData {
  return {
    id: rates.id,
    gold: Number(rates.gold),
    silver: Number(rates.silver),
    platinum: Number(rates.platinum),
    palladium: Number(rates.palladium),
    updatedAt: rates.updatedAt,
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Получить текущие курсы металлов.
 * Если записи нет — создаёт дефолтную.
 */
export async function getMetalRates(): Promise<MetalRatesResult> {
  try {
    // Пытаемся получить существующую запись
    let rates = await prisma.metalRate.findUnique({
      where: { id: "current" },
    });

    // Если записи нет — создаём дефолтную
    if (!rates) {
      rates = await prisma.metalRate.create({
        data: {
          id: "current",
          gold: DEFAULT_RATES.gold,
          silver: DEFAULT_RATES.silver,
          platinum: DEFAULT_RATES.platinum,
          palladium: DEFAULT_RATES.palladium,
        },
      });
    }

    return {
      success: true,
      data: serializeMetalRates(rates),
    };
  } catch (error) {
    console.error("Ошибка при получении курсов металлов:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить курсы металлов.
 * TODO: Добавить проверку роли админа
 */
export async function updateMetalRates(
  input: UpdateMetalRatesInput
): Promise<MetalRatesResult> {
  try {
    // Валидация входных данных
    if (
      input.gold <= 0 ||
      input.silver <= 0 ||
      input.platinum <= 0 ||
      input.palladium <= 0
    ) {
      return {
        success: false,
        error: "Все курсы должны быть положительными числами",
      };
    }

    // Обновляем или создаём запись (upsert)
    const rates = await prisma.metalRate.upsert({
      where: { id: "current" },
      update: {
        gold: input.gold,
        silver: input.silver,
        platinum: input.platinum,
        palladium: input.palladium,
      },
      create: {
        id: "current",
        gold: input.gold,
        silver: input.silver,
        platinum: input.platinum,
        palladium: input.palladium,
      },
    });

    // Инвалидируем кеш страниц, которые зависят от курсов
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/products");

    return {
      success: true,
      data: serializeMetalRates(rates),
    };
  } catch (error) {
    console.error("Ошибка при обновлении курсов металлов:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

// ============================================================================
// GLOBAL SETTINGS SERVER ACTIONS
// ============================================================================

/** Дефолтное значение наценки */
const DEFAULT_MARKUP = 1.0;

/**
 * Получить глобальные настройки.
 * Если записи нет — создаёт дефолтную с priceMarkup = 1.0
 */
export async function getGlobalSettings(): Promise<GlobalSettingsResult> {
  try {
    // Пытаемся получить существующую запись
    let settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    // Если записи нет — создаём дефолтную
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          id: "global",
          priceMarkup: DEFAULT_MARKUP,
          phoneNumber: "",
          email: "",
          telegramUsername: "",
          address: "",
          workSchedule: "",
        },
      });
    }

    return {
      success: true,
      data: {
        id: settings.id,
        priceMarkup: settings.priceMarkup,
        updatedAt: settings.updatedAt,
        phoneNumber: settings.phoneNumber,
        email: settings.email,
        telegramUsername: settings.telegramUsername,
        address: settings.address,
        workSchedule: settings.workSchedule,
      },
    };
  } catch (error) {
    console.error("Ошибка при получении глобальных настроек:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить глобальные настройки.
 * TODO: Добавить проверку роли админа
 */
export async function updateGlobalSettings(
  input: UpdateGlobalSettingsInput
): Promise<GlobalSettingsResult> {
  try {
    // Валидация входных данных (только если priceMarkup передан)
    if (input.priceMarkup !== undefined) {
      if (input.priceMarkup <= 0) {
        return {
          success: false,
          error: "Коэффициент наценки должен быть положительным числом",
        };
      }

      if (input.priceMarkup > 10) {
        return {
          success: false,
          error: "Коэффициент наценки не может превышать 10 (1000%)",
        };
      }
    }

    // Собираем данные для обновления
    const updateData: Partial<UpdateGlobalSettingsInput> = {};
    if (input.priceMarkup !== undefined) updateData.priceMarkup = input.priceMarkup;
    if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.telegramUsername !== undefined) updateData.telegramUsername = input.telegramUsername;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.workSchedule !== undefined) updateData.workSchedule = input.workSchedule;

    // Обновляем или создаём запись (upsert)
    const settings = await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: updateData,
      create: {
        id: "global",
        priceMarkup: input.priceMarkup ?? DEFAULT_MARKUP,
        phoneNumber: input.phoneNumber ?? "",
        email: input.email ?? "",
        telegramUsername: input.telegramUsername ?? "",
        address: input.address ?? "",
        workSchedule: input.workSchedule ?? "",
      },
    });

    // Инвалидируем кеш страниц, которые зависят от цен и контактов
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/products");
    revalidatePath("/catalog");
    revalidatePath("/contacts");

    return {
      success: true,
      data: {
        id: settings.id,
        priceMarkup: settings.priceMarkup,
        updatedAt: settings.updatedAt,
        phoneNumber: settings.phoneNumber,
        email: settings.email,
        telegramUsername: settings.telegramUsername,
        address: settings.address,
        workSchedule: settings.workSchedule,
      },
    };
  } catch (error) {
    console.error("Ошибка при обновлении глобальных настроек:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить текущий коэффициент наценки (удобный хелпер)
 * Используется в расчёте цен
 */
export async function getPriceMarkup(): Promise<number> {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });
    return settings?.priceMarkup ?? DEFAULT_MARKUP;
  } catch (error) {
    console.error("Ошибка при получении коэффициента наценки:", error);
    return DEFAULT_MARKUP;
  }
}
