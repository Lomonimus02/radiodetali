"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  Send,
  AlertCircle,
} from "lucide-react";
import { useCartStore, type ItemCondition } from "@/store";
import { getProductsByIds, type ProductWithPrice } from "@/app/actions";

// WhatsApp номер для отправки заявки
const WHATSAPP_NUMBER = "79001234567";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(price);
}

// Получить цену товара в зависимости от состояния
function getItemPrice(product: ProductWithPrice, condition: ItemCondition): number {
  if (condition === "new") {
    return product.priceNew ?? 0;
  }
  return product.priceUsed ?? 0;
}

// Получить текстовую метку для состояния
function getConditionLabel(condition: ItemCondition): string {
  return condition === "new" ? "Новый" : "Б/У";
}

interface CartItemWithProduct {
  id: string;
  quantity: number;
  condition: ItemCondition;
  product: ProductWithPrice;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем актуальные данные о товарах
  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Уникальные ID продуктов (один продукт может быть в корзине дважды с разным condition)
      const uniqueIds = [...new Set(items.map((item) => item.id))];
      const result = await getProductsByIds(uniqueIds);

      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Объединяем данные корзины с данными товаров
      const cartWithProducts: CartItemWithProduct[] = [];
      for (const item of items) {
        const product = result.data.find((p) => p.id === item.id);
        if (product) {
          cartWithProducts.push({
            id: item.id,
            quantity: item.quantity,
            condition: item.condition,
            product,
          });
        }
      }

      setCartItems(cartWithProducts);
      setLoading(false);
    }

    fetchProducts();
  }, [items]);

  const totalSum = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item.product, item.condition) * item.quantity,
    0
  );

  const handleSendToWhatsApp = () => {
    if (cartItems.length === 0) return;

    let message = "Привет, хочу сдать:\n\n";
    
    cartItems.forEach((item) => {
      const itemTotal = getItemPrice(item.product, item.condition) * item.quantity;
      const conditionLabel = getConditionLabel(item.condition);
      message += `- ${item.product.name} [${conditionLabel}] (x${item.quantity}) - ${formatPrice(itemTotal)}\n`;
    });
    
    message += `\nИтого: ${formatPrice(totalSum)}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary-500)] border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--gray-900)] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад в каталог
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Лист оценки
            </h1>
            <p className="text-[var(--gray-600)] mt-1">
              Список деталей, которые вы хотите сдать
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-2 px-4 py-2 text-[var(--gray-600)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Очистить</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2">
              Лист оценки пуст
            </h2>
            <p className="text-[var(--gray-600)] mb-6">
              Добавьте детали из каталога, чтобы узнать общую сумму выкупа
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold rounded-lg transition-colors"
            >
              <Package className="w-5 h-5" />
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-${item.condition}`}
                  className="bg-white rounded-xl border border-[var(--gray-200)] p-4 flex gap-4"
                >
                  {/* Image */}
                  <Link
                    href={`/catalog/${item.product.slug}`}
                    className="relative w-24 h-24 shrink-0 bg-[var(--gray-100)] rounded-lg overflow-hidden"
                  >
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-8 h-8 text-[var(--gray-300)]" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/catalog/${item.product.slug}`}
                      className="font-semibold text-[var(--gray-900)] hover:text-[var(--primary-600)] transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-[var(--gray-500)] mt-0.5">
                      {item.product.categoryName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-[var(--gray-500)] font-mono">
                        {item.product.slug.toUpperCase()}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.condition === "new"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {getConditionLabel(item.condition)}
                      </span>
                    </div>
                    <p className="text-[var(--accent-600)] font-semibold mt-2">
                      {formatPrice(getItemPrice(item.product, item.condition))} / шт.
                    </p>
                  </div>

                  {/* Quantity & Total */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[var(--gray-100)] rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.condition, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-[var(--gray-200)] transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            updateQuantity(item.id, item.condition, value);
                          }}
                          className="w-12 h-8 text-center bg-transparent border-none outline-none font-semibold"
                          min="0"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.condition, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-[var(--gray-200)] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.condition)}
                        className="w-8 h-8 flex items-center justify-center text-[var(--gray-400)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-lg font-bold text-[var(--gray-900)]">
                      {formatPrice(getItemPrice(item.product, item.condition) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 sticky top-24">
                <h2 className="text-lg font-bold text-[var(--gray-900)] mb-4">
                  Итого
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[var(--gray-600)]">
                    <span>Позиций:</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-[var(--gray-600)]">
                    <span>Всего деталей:</span>
                    <span>
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      шт.
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[var(--gray-200)]">
                    <div className="flex justify-between items-end">
                      <span className="text-[var(--gray-900)] font-medium">
                        Вы получите:
                      </span>
                      <span className="text-2xl font-bold text-[var(--accent-600)]">
                        {formatPrice(totalSum)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleSendToWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    Отправить в WhatsApp
                  </button>
                  
                  <Link
                    href="/contacts"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-700)] font-medium rounded-lg transition-colors"
                  >
                    Связаться по телефону
                  </Link>
                </div>

                <p className="text-xs text-[var(--gray-500)] mt-4 text-center">
                  Цены актуальны на момент просмотра. Окончательная сумма
                  определяется при оценке.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
