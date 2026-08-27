"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  defaultInfoButtonLabel,
  type CategoryInfoBlock,
} from "@/lib/category-info";

interface CategoryInfoPageEditorProps {
  categoryName: string;
  enabled: boolean;
  buttonLabel: string;
  blocks: CategoryInfoBlock[];
  onEnabledChange: (enabled: boolean) => void;
  onButtonLabelChange: (label: string) => void;
  onBlocksChange: (blocks: CategoryInfoBlock[]) => void;
}

function newId(): string {
  return crypto.randomUUID();
}

export function CategoryInfoPageEditor({
  categoryName,
  enabled,
  buttonLabel,
  blocks,
  onEnabledChange,
  onButtonLabelChange,
  onBlocksChange,
}: CategoryInfoPageEditorProps) {
  const placeholder = defaultInfoButtonLabel(categoryName || "категории");

  const handleEnabledChange = (next: boolean) => {
    onEnabledChange(next);
    if (next && !buttonLabel.trim()) {
      onButtonLabelChange(defaultInfoButtonLabel(categoryName || "категории"));
    }
  };

  const addTextBlock = () => {
    onBlocksChange([...blocks, { id: newId(), type: "text", content: "" }]);
  };

  const addImageBlock = () => {
    onBlocksChange([...blocks, { id: newId(), type: "image", url: "" }]);
  };

  const updateBlock = (id: string, patch: Partial<CategoryInfoBlock>) => {
    onBlocksChange(
      blocks.map((block) =>
        block.id === id ? ({ ...block, ...patch } as CategoryInfoBlock) : block,
      ),
    );
  };

  const removeBlock = (id: string) => {
    onBlocksChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onBlocksChange(copy);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Информационная страница
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Кнопка под баннером открывает страницу с текстом и фото. Контент можно
          подготовить заранее — кнопка и страница появятся на сайте только после
          публикации.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Показать кнопку и опубликовать страницу
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Пока выключено, страница недоступна посетителям, блоки можно
              редактировать.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Текст кнопки
          </label>
          <input
            type="text"
            value={buttonLabel}
            onChange={(e) => onButtonLabelChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            placeholder={placeholder}
          />
          <p className="mt-1 text-xs text-slate-500">
            Можно указать уточнение в скобках, например: «Важная информация о
            микросхемах (логика)»
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">Блоки</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addTextBlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
              >
                <Type className="w-4 h-4" />
                Добавить текст
              </button>
              <button
                type="button"
                onClick={addImageBlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
              >
                <ImagePlus className="w-4 h-4" />
                Добавить фото
              </button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Блоков пока нет. Добавьте текст или фото — порядок можно менять
              стрелками.
            </p>
          ) : (
            <ul className="space-y-3">
              {blocks.map((block, index) => (
                <li
                  key={block.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {block.type === "text" ? "Текст" : "Фото"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-white disabled:opacity-30"
                        title="Выше"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === blocks.length - 1}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-white disabled:opacity-30"
                        title="Ниже"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                        title="Удалить"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {block.type === "text" ? (
                    <textarea
                      rows={4}
                      value={block.content}
                      onChange={(e) =>
                        updateBlock(block.id, { content: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 resize-y text-sm"
                      placeholder="Обычный текст, без HTML и разметки"
                    />
                  ) : (
                    <ImageBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageBlockEditor({
  block,
  onChange,
}: {
  block: Extract<CategoryInfoBlock, { type: "image" }>;
  onChange: (patch: Partial<Extract<CategoryInfoBlock, { type: "image" }>>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        setUploadError("Не удалось загрузить изображение");
        return;
      }

      const result = await response.json();
      if (result.success) {
        onChange({ url: result.url });
      } else {
        setUploadError(result.error || "Ошибка загрузки");
      }
    } catch {
      setUploadError("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm">
          <Upload className="w-4 h-4 text-slate-500" />
          {isUploading ? "Загрузка..." : block.url ? "Заменить фото" : "Загрузить фото"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>
        {block.url && (
          <button
            type="button"
            onClick={() => onChange({ url: "" })}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Удалить фото
          </button>
        )}
      </div>
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      {block.url && (
        <div className="relative h-36 w-full max-w-md overflow-hidden rounded-lg border border-slate-200">
          <Image src={block.url} alt={block.alt || "Фото блока"} fill className="object-cover" />
        </div>
      )}
      <input
        type="text"
        value={block.alt || ""}
        onChange={(e) => onChange({ alt: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
        placeholder="Подпись (alt), необязательно"
      />
    </div>
  );
}
