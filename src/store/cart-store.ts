"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { YearPeriodId } from "@/lib/year-discount";

export type ItemCondition = "new" | "used";
export type { YearPeriodId };

export interface InventoryLine {
  lineId: string;
  productId: string;
  modificationId: string | null;
  condition: ItemCondition;
  yearPeriodId: YearPeriodId;
  quantity: number;
}

export type AddLineInput = Omit<InventoryLine, "lineId">;

interface CartState {
  items: InventoryLine[];
  hasHydrated: boolean;

  addLine: (payload: AddLineInput) => void;
  removeLine: (lineId: string) => void;
  updateLineQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getLineCount: () => number;
  getTotalPieces: () => number;
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addLine: (payload) => {
        const line: InventoryLine = {
          lineId: crypto.randomUUID(),
          productId: payload.productId,
          modificationId: payload.modificationId,
          condition: payload.condition,
          yearPeriodId: payload.yearPeriodId,
          quantity: normalizeQuantity(payload.quantity),
        };

        set((state) => ({
          items: [...state.items, line],
        }));
      },

      removeLine: (lineId) => {
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        }));
      },

      updateLineQuantity: (lineId, quantity) => {
        set((state) => {
          if (!Number.isFinite(quantity) || quantity < 1) {
            return {
              items: state.items.filter((item) => item.lineId !== lineId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.lineId === lineId
                ? { ...item, quantity: Math.floor(quantity) }
                : item,
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getLineCount: () => get().items.length,

      getTotalPieces: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "scrap-inventory-v2",
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hasHydrated: true });
      },
    },
  ),
);
