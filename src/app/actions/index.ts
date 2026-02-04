/**
 * Server Actions для управления данными
 *
 * Этот файл реэкспортирует все server actions для удобного импорта.
 * Использование:
 *
 * import { getProducts, getMetalRates, getGlobalSettings } from "@/app/actions";
 */

// Курсы металлов и глобальные настройки
export {
  getMetalRates,
  updateMetalRates,
  getGlobalSettings,
  updateGlobalSettings,
  getPriceMarkup,
  type MetalRatesData,
  type UpdateMetalRatesInput,
  type MetalRatesResult,
  type GlobalSettingsData,
  type UpdateGlobalSettingsInput,
  type GlobalSettingsResult,
} from "./settings";

// Авторизация
export {
  loginAdmin,
  logoutAdmin,
  isAuthenticated,
  type LoginResult,
} from "./auth";

// Товары
export {
  getProducts,
  getProductById,
  getProductBySlug,
  getProductsByIds,
  getAllProductSlugs,
  findBestMatchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  type UnitType,
  type ProductFilters,
  type ProductWithPrice,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductsResult,
  type ProductResult,
  type DeleteResult,
  type SearchRedirectResult,
} from "./products";

// Категории
export {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryShowcase,
  getSubcategories,
  getCategoryBreadcrumbs,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryData,
  type CategoryShowcaseItem,
  type CategoryShowcaseResult,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoriesResult,
  type CategoryResult,
  type DeleteCategoryResult,
} from "./categories";
