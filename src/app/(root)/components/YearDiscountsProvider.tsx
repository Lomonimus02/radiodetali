"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_YEAR_PERIOD_DISCOUNTS,
  type YearPeriodDiscounts,
} from "@/lib/year-discount";

const YearDiscountsContext = createContext<YearPeriodDiscounts>(
  DEFAULT_YEAR_PERIOD_DISCOUNTS,
);

export function YearDiscountsProvider({
  value,
  children,
}: {
  value: YearPeriodDiscounts;
  children: React.ReactNode;
}) {
  return (
    <YearDiscountsContext.Provider value={value}>
      {children}
    </YearDiscountsContext.Provider>
  );
}

export function useYearPeriodDiscounts(): YearPeriodDiscounts {
  return useContext(YearDiscountsContext);
}
