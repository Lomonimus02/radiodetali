"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  type CategoryData,
} from "@/app/actions";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface CategoryFormProps {
  categories: CategoryData[];
  editCategory?: CategoryData;
  defaultParentId?: string;
  redirectPath?: string;
}

interface FormData {
  name: string;
  slug: string;
  parentId: string;
  sortOrder: number;
  childSortOrder: number;
  warningMessage: string;
  // Закрепить управление курсом на Дашборде
  isPinnedToDashboard: boolean;
  // Кастомные курсы металлов (цена за 1 мг в рублях)
  customRateAu: string;
  customRateAg: string;
  customRatePt: string;
  customRatePd: string;
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

export function CategoryForm({
  categories,
  editCategory,
  defaultParentId,
  redirectPath,
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const isEditing = !!editCategory;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: editCategory?.name || "",
      slug: editCategory?.slug || "",
      parentId: editCategory?.parentId || defaultParentId || "",
      sortOrder: editCategory?.sortOrder ?? 0,
      childSortOrder: editCategory?.childSortOrder ?? 0,
      warningMessage: editCategory?.warningMessage || "",
      isPinnedToDashboard: editCategory?.isPinnedToDashboard ?? false,
      customRateAu: editCategory?.customRateAu?.toString() || "",
      customRateAg: editCategory?.customRateAg?.toString() || "",
      customRatePt: editCategory?.customRatePt?.toString() || "",
      customRatePd: editCategory?.customRatePd?.toString() || "",
    },
  });

  // Смотрим parentId чтобы показать/скрыть childSortOrder
  const watchParentId = watch("parentId");
  const isRootCategory = !watchParentId && !defaultParentId;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEditing && name) {
      setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = (data: FormData) => {
    setNotification(null);

    // Преобразуем кастомные курсы: пустая строка -> null, иначе число
    const parseRate = (value: string): number | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const num = parseFloat(trimmed);
      return isNaN(num) ? null : num;
    };

    startTransition(async () => {
      let result;

      if (isEditing) {
        result = await updateCategory({
          id: editCategory.id,
          name: data.name,
          slug: data.slug,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          childSortOrder: data.childSortOrder,
          warningMessage: data.warningMessage || null,
          isPinnedToDashboard: data.isPinnedToDashboard,
          customRateAu: parseRate(data.customRateAu),
          customRateAg: parseRate(data.customRateAg),
          customRatePt: parseRate(data.customRatePt),
          customRatePd: parseRate(data.customRatePd),
        });
      } else {
        result = await createCategory({
          name: data.name,
          slug: data.slug,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          childSortOrder: data.childSortOrder,
          warningMessage: data.warningMessage || null,
          isPinnedToDashboard: data.isPinnedToDashboard,
          customRateAu: parseRate(data.customRateAu),
          customRateAg: parseRate(data.customRateAg),
          customRatePt: parseRate(data.customRatePt),
          customRatePd: parseRate(data.customRatePd),
        });
      }

      if (result.success) {
        setNotification({
          type: "success",
          message: isEditing ? "Категория обновлена" : "Категория создана",
        });
        setTimeout(() => {
          // Редирект в нужную папку каталога
          const targetPath = redirectPath || (data.parentId ? `/admin/catalog/${data.parentId}` : "/admin/catalog");
          router.push(targetPath);
        }, 1000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка при сохранении",
        });
      }
    });
  };

  // Available parent categories (exclude self and children for editing)
  const availableParents = categories.filter((cat) => {
    if (!isEditing) return true;
    // Can't be parent of itself
    if (cat.id === editCategory.id) return false;
    // Can't select own children as parent (to prevent cycles)
    if (cat.parentId === editCategory.id) return false;
    return true;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">
          Основная информация
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="cat-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Название *
            </label>
            <input
              type="text"
              id="cat-name"
              {...register("name", { required: "Название обязательно" })}
              onChange={(e) => {
                register("name").onChange(e);
                handleNameChange(e);
              }}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
              }`}
              placeholder="Конденсаторы"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="cat-slug"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              URL (slug) *
            </label>
            <input
              type="text"
              id="cat-slug"
              {...register("slug", { required: "Slug обязателен" })}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.slug ? "border-red-300 bg-red-50" : "border-slate-300"
              }`}
              placeholder="kondensatory"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          {/* Parent */}
          <div>
            <label
              htmlFor="cat-parent"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Родительская категория
            </label>
            <select
              id="cat-parent"
              {...register("parentId")}
              disabled={!!defaultParentId && !isEditing}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                defaultParentId && !isEditing ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Без родителя (корневая)</option>
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {defaultParentId && !isEditing && (
              <p className="mt-1 text-xs text-slate-500">
                Категория будет создана внутри выбранной папки
              </p>
            )}
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="cat-sortOrder"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Порядковый номер (Сортировка)
            </label>
            <input
              type="number"
              id="cat-sortOrder"
              step="1"
              {...register("sortOrder", { valueAsNumber: true })}
              className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-slate-500">
              Чем меньше число, тем выше категория в списке
            </p>
          </div>

          {/* Child Sort Order - только для корневых категорий */}
          {isRootCategory && (
            <div>
              <label
                htmlFor="cat-childSortOrder"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Порядок среди подкатегорий (для отображения товаров)
              </label>
              <input
                type="number"
                id="cat-childSortOrder"
                step="1"
                {...register("childSortOrder", { valueAsNumber: true })}
                className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-slate-500">
                Определяет позицию товаров родительской категории среди подкатегорий.
                Например: 0 = первыми, 100 = последними.
              </p>
            </div>
          )}

          {/* Warning Message */}
          <div>
            <label
              htmlFor="cat-warningMessage"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Предупреждение (Инфо-блок)
            </label>
            <textarea
              id="cat-warningMessage"
              rows={3}
              {...register("warningMessage")}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              placeholder="Например: С 1990 года минус 10% от стоимости..."
            />
            <p className="mt-1 text-xs text-slate-500">
              Если оставить пустым — блок не будет отображаться на сайте
            </p>
          </div>

          {/* Pin to Dashboard */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="cat-isPinnedToDashboard"
              {...register("isPinnedToDashboard")}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="cat-isPinnedToDashboard"
              className="text-sm font-medium text-slate-700 cursor-pointer select-none"
            >
              Закрепить управление курсом на Дашборде
            </label>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            Если включено — поля специальных курсов этой категории будут отображаться на главной странице админки
          </p>
        </div>
      </div>

      {/* Custom Metal Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Специальные курсы (Опционально)
        </h2>
        <p className="text-sm text-amber-600 mb-6">
          ⚠️ Заполнять, ТОЛЬКО если для этой категории цена металла отличается от биржевой. Иначе оставить пустым.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Au - Золото */}
          <div>
            <label
              htmlFor="cat-customRateAu"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Au (Золото)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRateAu"
                step="0.01"
                min="0"
                {...register("customRateAu")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>

          {/* Ag - Серебро */}
          <div>
            <label
              htmlFor="cat-customRateAg"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Ag (Серебро)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRateAg"
                step="0.01"
                min="0"
                {...register("customRateAg")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>

          {/* Pt - Платина */}
          <div>
            <label
              htmlFor="cat-customRatePt"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Pt (Платина)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRatePt"
                step="0.01"
                min="0"
                {...register("customRatePt")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>

          {/* Pd - Палладий */}
          <div>
            <label
              htmlFor="cat-customRatePd"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Pd (Палладий)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRatePd"
                step="0.01"
                min="0"
                {...register("customRatePd")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isEditing ? "Сохранить изменения" : "Создать категорию"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
