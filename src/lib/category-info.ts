export type CategoryInfoTextBlock = {
  id: string;
  type: "text";
  content: string;
};

export type CategoryInfoImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt?: string;
};

export type CategoryInfoBlock = CategoryInfoTextBlock | CategoryInfoImageBlock;

export function defaultInfoButtonLabel(name: string): string {
  return `Важная информация о ${name.trim().toLowerCase()}`;
}

export function resolveInfoButtonLabel(
  label: string | null | undefined,
  name: string,
): string {
  const trimmed = label?.trim();
  return trimmed || defaultInfoButtonLabel(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseInfoPageBlocks(raw: unknown): CategoryInfoBlock[] {
  if (!Array.isArray(raw)) return [];

  const blocks: CategoryInfoBlock[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;

    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : crypto.randomUUID();

    if (item.type === "text") {
      const content = typeof item.content === "string" ? item.content.trim() : "";
      blocks.push({ id, type: "text", content });
      continue;
    }

    if (item.type === "image") {
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (!url) continue;
      const alt = typeof item.alt === "string" ? item.alt.trim() : "";
      if (alt) {
        blocks.push({ id, type: "image", url, alt });
      } else {
        blocks.push({ id, type: "image", url });
      }
    }
  }

  return blocks;
}
