import { getCategories } from "@/app/actions";
import { ProductForm } from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const categoriesResult = await getCategories();

  if (!categoriesResult.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Ошибка загрузки категорий: {categoriesResult.error}
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Новый товар
          </h1>
          <p className="text-slate-500 mt-1">
            Заполните информацию о товаре
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm categories={categoriesResult.data} />
    </div>
  );
}
