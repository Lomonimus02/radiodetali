"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store";
import { useEffect, useState } from "react";

interface CartIndicatorProps {
  className?: string;
}

export function CartIndicator({ className = "" }: CartIndicatorProps) {
  const { getTotalItems, items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItems() : 0;
  const hasItems = totalItems > 0;

  return (
    <Link
      href="/cart"
      className={`relative flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors ${className}`}
    >
      <div className="relative">
        <ShoppingBag className="w-6 h-6" />
        {mounted && hasItems && (
          <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-[var(--accent-500)] text-white text-xs font-bold rounded-full">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </div>
      <span className="hidden sm:inline font-medium">Лист оценки</span>
    </Link>
  );
}
