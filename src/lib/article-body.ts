export type ArticleBodyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

export type ArticleMarkupKind = "heading" | "ul" | "ol";

const MARKUP_PREFIX: Record<ArticleMarkupKind, string> = {
  heading: "## ",
  ul: "- ",
  ol: "1. ",
};

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

function classifyChunk(chunk: string): ArticleBodyBlock {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 1 && lines[0].startsWith("## ")) {
    const text = lines[0].slice(3).trim();
    if (text) return { kind: "heading", text };
  }

  if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
    const items = lines.map((line) => line.slice(2).trim()).filter((item) => item.length > 0);
    if (items.length > 0) return { kind: "ul", items };
  }

  if (lines.length > 0 && lines.every((line) => /^\d+\. /.test(line))) {
    const items = lines
      .map((line) => line.replace(/^\d+\. /, "").trim())
      .filter((item) => item.length > 0);
    if (items.length > 0) return { kind: "ol", items };
  }

  return { kind: "paragraph", text: chunk };
}

function blocksFromText(text: string): ArticleBodyBlock[] {
  return splitParagraphs(text).map((chunk) => classifyChunk(chunk));
}

/** Снимает один блок :::table, затем режет текст на абзацы, подзаголовки и списки. */
export function parseArticleBody(body: string): ArticleBodyBlock[] {
  const match = body.match(TABLE_FENCE);
  if (!match || match.index === undefined) {
    return blocksFromText(body);
  }

  const before = body.slice(0, match.index);
  const after = body.slice(match.index + match[0].length);
  const table = parseTableBlock(match[1]);
  const blocks: ArticleBodyBlock[] = blocksFromText(before);

  if (table) {
    blocks.push({ kind: "table", header: table.header, rows: table.rows });
  }

  blocks.push(...blocksFromText(after));
  return blocks;
}

function isMarkupLine(line: string, kind: ArticleMarkupKind): boolean {
  if (kind === "heading") return line.startsWith("## ");
  if (kind === "ul") return line.startsWith("- ");
  return /^\d+\. /.test(line);
}

function previousContentLine(before: string): string {
  const end = before.endsWith("\n") ? before.slice(0, -1) : before;
  const nl = end.lastIndexOf("\n");
  return nl === -1 ? end : end.slice(nl + 1);
}

/** Вставляет строку ##, «- » или «1. » так, чтобы блок отделился пустой строкой. */
export function insertArticleMarkup(
  body: string,
  start: number,
  end: number,
  kind: ArticleMarkupKind,
): { value: string; cursor: number } {
  const prefix = MARKUP_PREFIX[kind];
  const safeStart = Math.max(0, Math.min(start, body.length));
  const safeEnd = Math.max(safeStart, Math.min(end, body.length));
  const before = body.slice(0, safeStart);
  const selected = body.slice(safeStart, safeEnd);
  const after = body.slice(safeEnd);

  const continueList =
    kind !== "heading" && isMarkupLine(previousContentLine(before), kind);

  let lead = "";
  if (before.length > 0) {
    if (continueList) {
      lead = before.endsWith("\n") ? "" : "\n";
    } else if (before.endsWith("\n\n")) {
      lead = "";
    } else if (before.endsWith("\n")) {
      lead = "\n";
    } else {
      lead = "\n\n";
    }
  }

  let trail = "";
  if (after.startsWith("\n") && !after.startsWith("\n\n")) {
    const nextLine = after.slice(1).split("\n", 1)[0];
    const continues = kind !== "heading" && isMarkupLine(nextLine, kind);
    if (!continues && nextLine.length > 0) {
      trail = "\n";
    }
  }

  const chunk = lead + prefix + selected + trail;
  return {
    value: before + chunk + after,
    cursor: before.length + lead.length + prefix.length + selected.length,
  };
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
