"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Menu, X, Zap, Package, Phone, MapPin, Loader2, ChevronRight, Home } from "lucide-react";
import { findBestMatchProduct } from "@/app/actions";

const PHONE_NUMBER = "+7 (812) 983-49-76";
const PHONE_HREF = "tel:+78129834976";

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Блокируем скролл body когда меню открыто
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    
    setIsSearching(true);
    
    try {
      // Try to find the best matching product
      const result = await findBestMatchProduct(searchQuery.trim());
      
      if (result.success) {
        // Redirect to category page with highlight parameter
        router.push(`/catalog/${result.categorySlug}?highlight=${result.productSlug}`);
      } else {
        // Fallback to search page if no product found
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    } catch (error) {
      // Fallback to search page on error
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } finally {
      setSearchQuery("");
      setMobileMenuOpen(false);
      setIsSearching(false);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const menuItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/catalog", label: "Каталог", icon: Package },
    { href: "/contacts", label: "Контакты", icon: MapPin },
  ];

  return (
    <>
      <header className="bg-[var(--primary-900)] text-white shadow-lg relative z-50">
        <div className="container mx-auto px-4">
          {/* Main header row */}
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="hidden sm:block font-bold text-xl">
                Драг Союз
              </span>
            </Link>

            {/* Search bar - desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-2xl mx-4"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по маркировке или названию..."
                  className="w-full h-12 pl-5 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:bg-white/15"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/catalog"
                className="flex items-center gap-2 hover:text-[var(--accent-400)] transition-colors"
              >
                <Package className="w-5 h-5" />
                Каталог
              </Link>
              <Link
                href="/contacts"
                className="flex items-center gap-2 hover:text-[var(--accent-400)] transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Контакты
              </Link>
              <a
                href={PHONE_HREF}
                className="flex items-center gap-2 text-lg font-bold text-[var(--accent-400)] hover:text-[var(--accent-300)] transition-colors"
              >
                <Phone className="w-5 h-5" />
                {PHONE_NUMBER}
              </a>
            </nav>

            {/* Mobile: Phone + Menu button */}
            <div className="flex items-center gap-3 lg:hidden">
              <a
                href={PHONE_HREF}
                className="flex items-center gap-1 text-[var(--accent-400)] hover:text-[var(--accent-300)] transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-bold text-sm hidden sm:inline">{PHONE_NUMBER}</span>
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Меню"
              >
                <span className={`absolute w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
                <span className={`absolute w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'}`} />
                <span className={`absolute w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-menuFadeIn">
          {/* Menu panel - full screen */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary-900)] to-[var(--primary-800)]">
            {/* Menu header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg tracking-wide">ДРАГСОЮЗ</span>
              </div>
              <button
                onClick={closeMenu}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по маркировке..."
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:bg-white/15"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg disabled:opacity-50 text-white"
                  >
                    {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Navigation links */}
          <nav className="px-4 py-2">
            {menuItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center justify-between px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-white group ${
                  mobileMenuOpen ? 'animate-slideIn' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-500)]/20 flex items-center justify-center group-hover:bg-[var(--accent-500)]/30 transition-colors">
                    <item.icon className="w-5 h-5 text-[var(--accent-400)]" />
                  </div>
                  <span className="font-medium text-lg">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </nav>

          {/* Phone CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[var(--primary-900)]/80 backdrop-blur">
            <a
              href={PHONE_HREF}
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-600)] hover:from-[var(--accent-600)] hover:to-[var(--accent-700)] rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-amber-500/20"
            >
              <Phone className="w-5 h-5" />
              {PHONE_NUMBER}
            </a>
            <p className="text-center text-white/50 text-sm mt-3">
              Ежедневно с 10:00 до 20:00
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-menuFadeIn {
          animation: menuFadeIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
