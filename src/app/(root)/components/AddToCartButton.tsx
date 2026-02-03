"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Sparkles, Recycle } from "lucide-react";
import { useCartStore, type ItemCondition } from "@/store";

interface AddToCartButtonProps {
  productId: string;
  isNewAvailable?: boolean;
  isUsedAvailable?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AddToCartButton({
  productId,
  isNewAvailable = true,
  isUsedAvailable = true,
  size = "md",
}: AddToCartButtonProps) {
  const { addItem, removeItem, getQuantity } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const quantityNew = mounted ? getQuantity(productId, "new") : 0;
  const quantityUsed = mounted ? getQuantity(productId, "used") : 0;
  const totalQuantity = quantityNew + quantityUsed;

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-base",
    lg: "h-12 text-lg",
  };

  const buttonClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  // Только один тип доступен
  const onlyNewAvailable = isNewAvailable && !isUsedAvailable;
  const onlyUsedAvailable = !isNewAvailable && isUsedAvailable;
  const bothAvailable = isNewAvailable && isUsedAvailable;

  // Show loading placeholder during SSR
  if (!mounted) {
    return (
      <div
        className={`${sizeClasses[size]} w-full flex items-center justify-center gap-2 bg-[var(--gray-200)] text-[var(--gray-400)] font-semibold rounded-lg`}
      >
        <ShoppingBag className="w-4 h-4" />
        В лист оценки
      </div>
    );
  }

  // Если уже есть товары в корзине - показываем счётчики
  if (totalQuantity > 0) {
    return (
      <div className="space-y-1">
        {/* Новый */}
        {isNewAvailable && (
          <div
            className={`${sizeClasses[size]} flex items-center justify-between bg-green-50 border border-green-200 rounded-lg overflow-hidden`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeItem(productId, "new");
              }}
              className={`${buttonClasses[size]} flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 transition-colors`}
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Новый</span>
              <span className="font-bold text-green-700 min-w-[1.5rem] text-center">
                {quantityNew}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem(productId, "new");
              }}
              className={`${buttonClasses[size]} flex items-center justify-center bg-green-500 hover:bg-green-600 text-white transition-colors`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Б/У */}
        {isUsedAvailable && (
          <div
            className={`${sizeClasses[size]} flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg overflow-hidden`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeItem(productId, "used");
              }}
              className={`${buttonClasses[size]} flex items-center justify-center bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors`}
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1">
              <Recycle className="w-3 h-3 text-amber-600" />
              <span className="text-xs text-amber-600 font-medium">Б/У</span>
              <span className="font-bold text-amber-700 min-w-[1.5rem] text-center">
                {quantityUsed}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem(productId, "used");
              }}
              className={`${buttonClasses[size]} flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white transition-colors`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Начальное состояние - кнопка добавления

  // Если доступен только один тип
  if (onlyNewAvailable) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addItem(productId, "new");
        }}
        className={`${sizeClasses[size]} w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors`}
      >
        <Sparkles className="w-4 h-4" />
        В лист (Новый)
      </button>
    );
  }

  if (onlyUsedAvailable) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addItem(productId, "used");
        }}
        className={`${sizeClasses[size]} w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors`}
      >
        <Recycle className="w-4 h-4" />
        В лист (Б/У)
      </button>
    );
  }

  // Оба типа доступны - split кнопка
  if (bothAvailable) {
    return (
      <div className={`${sizeClasses[size]} w-full flex rounded-lg overflow-hidden shadow-sm`}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(productId, "new");
          }}
          className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors border-r border-green-600"
        >
          <Sparkles className="w-3 h-3" />
          <span className="text-xs sm:text-sm">Новый</span>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(productId, "used");
          }}
          className="flex-1 flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
        >
          <Recycle className="w-3 h-3" />
          <span className="text-xs sm:text-sm">Б/У</span>
        </button>
      </div>
    );
  }

  // Ничего не доступно
  return (
    <div
      className={`${sizeClasses[size]} w-full flex items-center justify-center gap-2 bg-[var(--gray-200)] text-[var(--gray-400)] font-semibold rounded-lg cursor-not-allowed`}
    >
      <ShoppingBag className="w-4 h-4" />
      Не принимается
    </div>
  );
}
