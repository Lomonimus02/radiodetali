"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/app/actions";
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Loader2 
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Настройки</h1>
        <p className="text-slate-500 mt-1">
          Управление безопасностью и параметрами системы
        </p>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Безопасность</h2>
          </div>
        </div>
        
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Валидация
    if (!currentPassword.trim()) {
      setError("Введите текущий пароль");
      return;
    }

    if (!newPassword.trim()) {
      setError("Введите новый пароль");
      return;
    }

    if (newPassword.length < 6) {
      setError("Новый пароль должен быть минимум 6 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Новый пароль должен отличаться от текущего");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Скрываем сообщение об успехе через 5 секунд
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div>
        <h3 className="text-base font-medium text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Смена пароля
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Рекомендуем использовать надёжный пароль минимум из 8 символов, 
          включая буквы и цифры.
        </p>
      </div>

      {/* Сообщения */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Пароль успешно изменён</span>
        </div>
      )}

      {/* Текущий пароль */}
      <div>
        <label 
          htmlFor="currentPassword" 
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Текущий пароль
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Новый пароль */}
      <div>
        <label 
          htmlFor="newPassword" 
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Новый пароль
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Минимум 6 символов"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Подтверждение пароля */}
      <div>
        <label 
          htmlFor="confirmPassword" 
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Подтвердите новый пароль
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Повторите новый пароль"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Сменить пароль
          </>
        )}
      </button>
    </form>
  );
}
