"use client";

import { useState, useTransition } from "react";
import { deleteCategory, type CategoryData } from "@/app/actions";
import { Edit, Trash2, Loader2, AlertCircle, FolderTree, CornerDownRight } from "lucide-react";
import { CategoryFormDialog } from "./CategoryFormDialog";

interface CategoriesTableProps {
  categories: CategoryData[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Удалить категорию "${name}"?`)) {
      return;
    }

    setError(null);
    setDeletingId(id);

    startTransition(async () => {
      const result = await deleteCategory(id);

      if (!result.success) {
        setError(result.error);
      }

      setDeletingId(null);
    });
  };

  if (categories.length === 0) {
    return (
      <div className="p-12 text-center">
        <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Категории не найдены</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error notification */}
      {error && (
        <div className="m-4 flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Название
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Родительская
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Товаров
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map((category) => {
              const isSubcategory = category.parentId !== null;
              
              return (
                <tr
                  key={category.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    deletingId === category.id ? "opacity-50" : ""
                  } ${isSubcategory ? "bg-slate-50/50" : ""}`}
                >
                  {/* Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {isSubcategory && (
                        <CornerDownRight className="w-4 h-4 text-slate-400 ml-2" />
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSubcategory 
                          ? "bg-amber-50" 
                          : "bg-indigo-50"
                      }`}>
                        <FolderTree className={`w-5 h-5 ${
                          isSubcategory 
                            ? "text-amber-600" 
                            : "text-indigo-600"
                        }`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-medium ${
                          isSubcategory 
                            ? "text-slate-600" 
                            : "text-slate-800"
                        }`}>
                          {category.name}
                        </span>
                        {isSubcategory && (
                          <span className="text-xs text-amber-600 font-medium">
                            Подкатегория
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                {/* Slug */}
                <td className="px-4 py-4">
                  <code className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {category.slug}
                  </code>
                </td>

                {/* Parent */}
                <td className="px-4 py-4">
                  {category.parentName ? (
                    <span className="text-slate-600">{category.parentName}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Product count */}
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      category.productCount > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {category.productCount}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <CategoryFormDialog
                      categories={categories}
                      editCategory={category}
                      trigger={
                        <button
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      }
                    />
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={isPending && deletingId === category.id}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Удалить"
                    >
                      {isPending && deletingId === category.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
