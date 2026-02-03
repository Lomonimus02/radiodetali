"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Состояние товара: новый или б/у
 */
export type ItemCondition = "new" | "used";

/**
 * Элемент корзины сдачи
 */
export interface CartItem {
  id: string;
  condition: ItemCondition; // Состояние: новый или б/у
  quantity: number;
}

/**
 * Уникальный ключ для элемента корзины (id + condition)
 */
function getCartKey(id: string, condition: ItemCondition): string {
  return `${id}:${condition}`;
}

/**
 * Состояние корзины
 */
interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (id: string, condition: ItemCondition) => void;
  removeItem: (id: string, condition: ItemCondition) => void;
  updateQuantity: (id: string, condition: ItemCondition, quantity: number) => void;
  clearCart: () => void;
  getQuantity: (id: string, condition?: ItemCondition) => number;
  getTotalItems: () => number;
}

/**
 * Zustand store для корзины сдачи
 * Использует persist middleware для сохранения в localStorage
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (id: string, condition: ItemCondition) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === id && item.condition === condition
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === id && item.condition === condition
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            items: [...state.items, { id, condition, quantity: 1 }],
          };
        });
      },

      removeItem: (id: string, condition: ItemCondition) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === id && item.condition === condition
          );
          if (!existingItem) return state;

          if (existingItem.quantity <= 1) {
            return {
              items: state.items.filter(
                (item) => !(item.id === id && item.condition === condition)
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.id === id && item.condition === condition
                ? { ...item, quantity: item.quantity - 1 }
                : item
            ),
          };
        });
      },

      updateQuantity: (id: string, condition: ItemCondition, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => !(item.id === id && item.condition === condition)
              ),
            };
          }
          return {
            items: state.items.map((item) =>
              item.id === id && item.condition === condition
                ? { ...item, quantity }
                : item
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getQuantity: (id: string, condition?: ItemCondition) => {
        if (condition) {
          const item = get().items.find(
            (item) => item.id === id && item.condition === condition
          );
          return item?.quantity ?? 0;
        }
        // Если condition не указан, возвращаем сумму обоих
        return get().items
          .filter((item) => item.id === id)
          .reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "scrap-cart-storage",
    }
  )
);
