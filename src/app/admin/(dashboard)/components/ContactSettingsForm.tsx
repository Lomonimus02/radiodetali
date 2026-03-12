"use client";

import { useState, useRef } from "react";
import { updateGlobalSettings, GlobalSettingsData } from "@/app/actions";
import { Phone, Mail, MapPin, Clock, Send, Loader2, Check, Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ContactSettingsFormProps {
  initialData: GlobalSettingsData;
}

export function ContactSettingsForm({ initialData }: ContactSettingsFormProps) {
  const [form, setForm] = useState({
    phoneNumber: initialData.phoneNumber || "",
    email: initialData.email || "",
    telegramUsername: initialData.telegramUsername || "",
    address: initialData.address || "",
    workSchedule: initialData.workSchedule || "",
  });
  const [storePhotoUrl, setStorePhotoUrl] = useState(initialData.storePhotoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMessage(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (result.success) {
        setStorePhotoUrl(result.url);
        setMessage({ type: "success", text: "Фото загружено" });
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка загрузки" });
      }
    } catch {
      setMessage({ type: "error", text: "Ошибка при загрузке файла" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setStorePhotoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateGlobalSettings({
        phoneNumber: form.phoneNumber,
        email: form.email,
        telegramUsername: form.telegramUsername,
        address: form.address,
        workSchedule: form.workSchedule,
        storePhotoUrl: storePhotoUrl || null,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Контактные данные сохранены!" });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Произошла ошибка при сохранении" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Phone Number */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Phone className="w-4 h-4 text-slate-400" />
          Телефон
        </label>
        <input
          type="text"
          value={form.phoneNumber}
          onChange={handleChange("phoneNumber")}
          placeholder="+7 (812) 983-49-76"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1">
          Формат: +7 (XXX) XXX-XX-XX
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Mail className="w-4 h-4 text-slate-400" />
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="info@dragsoyuz.ru"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Telegram */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Send className="w-4 h-4 text-slate-400" />
          Telegram
        </label>
        <input
          type="text"
          value={form.telegramUsername}
          onChange={handleChange("telegramUsername")}
          placeholder="dragsoyuz"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1">
          Введите имя пользователя без @ (например: dragsoyuz)
        </p>
      </div>

      {/* Address */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <MapPin className="w-4 h-4 text-slate-400" />
          Адрес
        </label>
        <textarea
          value={form.address}
          onChange={handleChange("address")}
          placeholder="г. Санкт-Петербург, ул. Примерная, д. 1"
          rows={2}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
        />
      </div>

      {/* Work Schedule */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          Режим работы
        </label>
        <textarea
          value={form.workSchedule}
          onChange={handleChange("workSchedule")}
          placeholder="Пн-Пт: 10:00 - 18:00&#10;Сб: по записи&#10;Вс: выходной"
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          Каждая строка — отдельный день/период
        </p>
      </div>

      {/* Store Photo */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          Фото магазина (для страницы контактов)
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-700">
                {isUploading ? "Загрузка..." : "Выбрать файл"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {storePhotoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Удалить фото"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            JPG, PNG, WebP или GIF. Максимум 5MB.
          </p>
          {storePhotoUrl && (
            <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={storePhotoUrl}
                alt="Фото магазина"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" && <Check className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          "Сохранить контакты"
        )}
      </button>
    </form>
  );
}
