export type ArticleBodyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "table"; header: string[]; rows: string[][] };

export const ARTICLE_TABLE_TEMPLATE = `:::table
Марка | До 1990 | С 2010
КТ315 | **высокая** | низкая
:::`;

const TABLE_FENCE = /:::table\r?\n([\s\S]*?)\r?\n:::/;

export function articleBodyHasTable(body: string): boolean {
  return body.includes(":::table");
}

export function stripArticleTables(body: string): string {
  return body.replace(/:::table[\s\S]*?:::/g, " ");
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function splitCells(line: string): string[] {
  return line.split(" | ");
}

function parseTableBlock(raw: string): { header: string[]; rows: string[][] } | null {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return null;

  const header = splitCells(lines[0]);
  const columnCount = Math.max(header.length, 1);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCells(line);
    while (cells.length < columnCount) cells.push("");
    return cells;
  });

  return { header, rows };
}

/** Снимает один блок :::table до нарезки абзацев. */
export function parseArticleBody(body: string): ArticleBodyBlock[] {
  const match = body.match(TABLE_FENCE);
  if (!match || match.index === undefined) {
    return splitParagraphs(body).map((text) => ({ kind: "paragraph", text }));
  }

  const before = body.slice(0, match.index);
  const after = body.slice(match.index + match[0].length);
  const table = parseTableBlock(match[1]);
  const blocks: ArticleBodyBlock[] = splitParagraphs(before).map((text) => ({
    kind: "paragraph",
    text,
  }));

  if (table) {
    blocks.push({ kind: "table", header: table.header, rows: table.rows });
  }

  blocks.push(
    ...splitParagraphs(after).map((text) => ({ kind: "paragraph" as const, text })),
  );
  return blocks;
}

export function insertArticleTable(
  body: string,
  start: number,
  end: number,
): { ok: true; value: string; cursor: number } | { ok: false; message: string } {
  if (articleBodyHasTable(body)) {
    return { ok: false, message: "В тексте уже есть таблица" };
  }

  const safeStart = Math.max(0, Math.min(start, body.length));
  const safeEnd = Math.max(safeStart, Math.min(end, body.length));
  const before = body.slice(0, safeStart);
  const after = body.slice(safeEnd);

  let prefix = "";
  if (before.length > 0 && !before.endsWith("\n\n")) {
    prefix = before.endsWith("\n") ? "\n" : "\n\n";
  }

  let suffix = "";
  if (after.length > 0 && !after.startsWith("\n\n")) {
    suffix = after.startsWith("\n") ? "\n" : "\n\n";
  }

  const chunk = prefix + ARTICLE_TABLE_TEMPLATE + suffix;
  return {
    ok: true,
    value: before + chunk + after,
    cursor: before.length + chunk.length,
  };
}
