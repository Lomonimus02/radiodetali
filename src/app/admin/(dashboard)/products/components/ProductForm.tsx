"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  type ProductWithPrice,
  type CategoryData,
} from "@/app/actions";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Package,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductFormProps {
  product?: ProductWithPrice;
  categories: CategoryData[];
}

interface FormData {
  name: string;
  slug: string;
  image: string;
  categoryId: string;
  sortOrder: number;
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
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  manualPriceNew: number | null;
  manualPriceUsed: number | null;
}

type NotificationType = "success" | "error" | null;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [imageUrl, setImageUrl] = useState(product?.image || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      image: product?.image || "",
      categoryId: product?.categoryId || "",
      sortOrder: product?.sortOrder ?? 0,
      // Содержание металлов для НОВЫХ
      contentGold: product?.contentGold || 0,
      contentSilver: product?.contentSilver || 0,
      contentPlatinum: product?.contentPlatinum || 0,
      contentPalladium: product?.contentPalladium || 0,
      // Содержание металлов для Б/У
      contentGoldUsed: product?.contentGoldUsed || 0,
      contentSilverUsed: product?.contentSilverUsed || 0,
      contentPlatinumUsed: product?.contentPlatinumUsed || 0,
      contentPalladiumUsed: product?.contentPalladiumUsed || 0,
      isNewAvailable: product?.isNewAvailable ?? true,
      isUsedAvailable: product?.isUsedAvailable ?? true,
      manualPriceNew: product?.manualPriceNew || null,
      manualPriceUsed: product?.manualPriceUsed || null,
    },
  });

  const watchName = watch("name");
  const watchIsNewAvailable = watch("isNewAvailable");
  const watchIsUsedAvailable = watch("isUsedAvailable");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEditing && name) {
      setValue("slug", generateSlug(name));
    }
  };

  // Загрузка изображения
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Показываем превью сразу
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.url);
        setImagePreview(result.url);
        setValue("image", result.url);
        setNotification({
          type: "success",
          message: "Изображение загружено",
        });
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка загрузки",
        });
        setImagePreview(imageUrl);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Ошибка при загрузке файла",
      });
      setImagePreview(imageUrl);
    } finally {
      setIsUploading(false);
      // Очищаем URL превью
      URL.revokeObjectURL(previewUrl);
    }
  };

  // Удаление изображения
  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: FormData) => {
    setNotification(null);

    startTransition(async () => {
      let result;

      if (isEditing) {
        result = await updateProduct({
          id: product.id,
          name: data.name,
          slug: data.slug,
          image: data.image || null,
          categoryId: data.categoryId,
          sortOrder: data.sortOrder,
          contentGold: data.contentGold,
          contentSilver: data.contentSilver,
          contentPlatinum: data.contentPlatinum,
          contentPalladium: data.contentPalladium,
          contentGoldUsed: data.contentGoldUsed,
          contentSilverUsed: data.contentSilverUsed,
          contentPlatinumUsed: data.contentPlatinumUsed,
          contentPalladiumUsed: data.contentPalladiumUsed,
          isNewAvailable: data.isNewAvailable,
          isUsedAvailable: data.isUsedAvailable,
          manualPriceNew: data.manualPriceNew,
          manualPriceUsed: data.manualPriceUsed,
        });
      } else {
        result = await createProduct({
          name: data.name,
          slug: data.slug,
          image: data.image || null,
          categoryId: data.categoryId,
          sortOrder: data.sortOrder,
          contentGold: data.contentGold,
          contentSilver: data.contentSilver,
          contentPlatinum: data.contentPlatinum,
          contentPalladium: data.contentPalladium,
          contentGoldUsed: data.contentGoldUsed,
          contentSilverUsed: data.contentSilverUsed,
          contentPlatinumUsed: data.contentPlatinumUsed,
          contentPalladiumUsed: data.contentPalladiumUsed,
          isNewAvailable: data.isNewAvailable,
          isUsedAvailable: data.isUsedAvailable,
          manualPriceNew: data.manualPriceNew,
          manualPriceUsed: data.manualPriceUsed,
        });
      }

      if (result.success) {
        setNotification({
          type: "success",
          message: isEditing ? "Товар обновлён" : "Товар создан",
        });
        setTimeout(() => {
          router.push("/admin/products");
        }, 1000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка при сохранении",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Основная информация
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Название *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name", { required: "Название обязательно" })}
                  onChange={(e) => {
                    register("name").onChange(e);
                    handleNameChange(e);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                  placeholder="Например: К10-17Б"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  URL (slug) *
                </label>
                <input
                  type="text"
                  id="slug"
                  {...register("slug", { required: "Slug обязателен" })}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.slug ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                  placeholder="k10-17b"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Категория *
                </label>
                <select
                  id="categoryId"
                  {...register("categoryId", { required: "Выберите категорию" })}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.categoryId ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentName ? `${cat.parentName} → ` : ""}
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Изображение
                </label>
                <input
                  type="hidden"
                  {...register("image")}
                />
                <div className="space-y-3">
                  {/* Upload button */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        {isUploading ? "Загрузка..." : "Выбрать файл"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить изображение"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    JPG, PNG, WebP или GIF. Максимум 5MB.
                  </p>
                  {imageUrl && (
                    <p className="text-xs text-green-600 truncate">
                      ✓ {imageUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Сортировка
            </h2>

            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Порядковый номер
              </label>
              <input
                type="number"
                id="sortOrder"
                step="1"
                {...register("sortOrder", { valueAsNumber: true })}
                className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-slate-500">
                Чем меньше число, тем выше товар в списке
              </p>
            </div>
          </div>

          {/* Metal content - NEW and USED in two columns */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Содержание металлов (мг)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Содержание в НОВОМ */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-green-800">
                    Содержание в НОВОМ
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="isNewAvailable"
                      {...register("isNewAvailable")}
                      className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-xs font-medium text-green-700">Принимаем</span>
                  </label>
                </div>
                <div className="space-y-3">
                  {[
                    { key: "contentGold" as const, label: "Золото", symbol: "Au" },
                    { key: "contentSilver" as const, label: "Серебро", symbol: "Ag" },
                    { key: "contentPlatinum" as const, label: "Платина", symbol: "Pt" },
                    { key: "contentPalladium" as const, label: "Палладий", symbol: "Pd" },
                  ].map((metal) => (
                    <div key={metal.key}>
                      <label
                        htmlFor={metal.key}
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        {metal.label} ({metal.symbol})
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700">
                            {metal.symbol}
                          </span>
                        </div>
                        <input
                          type="number"
                          id={metal.key}
                          step="0.000001"
                          min="0"
                          {...register(metal.key, { valueAsNumber: true, min: 0 })}
                          className="w-full pl-11 pr-8 py-2 text-sm rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                          мг
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Содержание в Б/У */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-amber-800">
                    Содержание в Б/У
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="isUsedAvailable"
                      {...register("isUsedAvailable")}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-medium text-amber-700">Принимаем</span>
                  </label>
                </div>
                <div className="space-y-3">
                  {[
                    { key: "contentGoldUsed" as const, label: "Золото", symbol: "Au" },
                    { key: "contentSilverUsed" as const, label: "Серебро", symbol: "Ag" },
                    { key: "contentPlatinumUsed" as const, label: "Платина", symbol: "Pt" },
                    { key: "contentPalladiumUsed" as const, label: "Палладий", symbol: "Pd" },
                  ].map((metal) => (
                    <div key={metal.key}>
                      <label
                        htmlFor={metal.key}
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        {metal.label} ({metal.symbol})
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-amber-700">
                            {metal.symbol}
                          </span>
                        </div>
                        <input
                          type="number"
                          id={metal.key}
                          step="0.000001"
                          min="0"
                          {...register(metal.key, { valueAsNumber: true, min: 0 })}
                          className="w-full pl-11 pr-8 py-2 text-sm rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                          мг
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-amber-700">
                  Обычно меньше из-за скушенных ножек и т.д.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing - Manual prices */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Фиксированные цены
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Оставьте пустым для автоматического расчёта по формуле
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New price */}
              {watchIsNewAvailable && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <label
                    htmlFor="manualPriceNew"
                    className="block text-sm font-medium text-green-800 mb-2"
                  >
                    Цена за НОВОЕ
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="manualPriceNew"
                      step="0.01"
                      min="0"
                      {...register("manualPriceNew", { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      placeholder="Авто"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      ₽
                    </span>
                  </div>
                </div>
              )}

              {/* Used price */}
              {watchIsUsedAvailable && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <label
                    htmlFor="manualPriceUsed"
                    className="block text-sm font-medium text-amber-800 mb-2"
                  >
                    Цена за Б/У
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="manualPriceUsed"
                      step="0.01"
                      min="0"
                      {...register("manualPriceUsed", { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      placeholder="Авто"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      ₽
                    </span>
                  </div>
                </div>
              )}

              {/* Show message if both are disabled */}
              {!watchIsNewAvailable && !watchIsUsedAvailable && (
                <div className="col-span-full text-center py-4 text-slate-500 text-sm">
                  Включите приём "Нового" или "Б/У" в блоке выше
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-700 mb-4">
              Превью изображения
            </h3>
            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                  onError={() => setImagePreview("")}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-16 h-16 mb-2" />
                  <span className="text-sm">Нет изображения</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEditing ? "Сохранить изменения" : "Создать товар"}
                  </>
                )}
              </button>

              <Link
                href="/admin/products"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад к списку
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
