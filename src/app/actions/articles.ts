"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "./auth";

const PAGE_SIZE_DEFAULT = 10;

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PublishedArticlesPage = {
  items: ArticleListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  published: boolean;
};

export type ArticleResult =
  | { success: true; data: ArticleListItem }
  | { success: false; error: string };

export type ArticlesAdminResult =
  | { success: true; data: ArticleListItem[] }
  | { success: false; error: string };

export type DeleteArticleResult =
  | { success: true }
  | { success: false; error: string };

function revalidateArticlePaths(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

function isSlugFormatValid(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function slugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) return false;
  return existing.id !== excludeId;
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Опубликованные статьи, новые сверху. page — 1-based.
 */
export async function getPublishedArticles(input: {
  page: number;
  pageSize?: number;
}): Promise<PublishedArticlesPage> {
  const pageSize = input.pageSize ?? PAGE_SIZE_DEFAULT;
  const page = input.page;
  const where = { published: true };
  const total = await prisma.article.count({ where });
  const pageCount = total === 0 ? 1 : Math.ceil(total / pageSize);
  const items = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageCount };
}

export async function getPublishedArticleBySlug(
  slug: string,
): Promise<ArticleListItem | null> {
  return prisma.article.findFirst({
    where: { slug, published: true },
  });
}

export async function adminListArticles(): Promise<ArticlesAdminResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const data = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data };
  } catch (error) {
    console.error("Ошибка при загрузке статей:", error);
    return { success: false, error: "Не удалось загрузить статьи" };
  }
}

export async function adminGetArticleById(id: string): Promise<ArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const data = await prisma.article.findUnique({ where: { id } });
    if (!data) {
      return { success: false, error: "Статья не найдена" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Ошибка при загрузке статьи:", error);
    return { success: false, error: "Не удалось загрузить статью" };
  }
}

function validateArticleInput(input: ArticleInput): {
  error?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  published: boolean;
} {
  const title = input.title.trim();
  const slug = normalizeSlug(input.slug);
  const body = input.body.trim();

  if (!title) {
    return {
      error: "Укажите название статьи",
      title,
      slug,
      excerpt: null,
      body,
      imageUrl: null,
      published: input.published,
    };
  }

  if (!slug) {
    return {
      error: "Укажите адрес статьи",
      title,
      slug,
      excerpt: null,
      body,
      imageUrl: null,
      published: input.published,
    };
  }

  if (!isSlugFormatValid(slug)) {
    return {
      error: "Адрес может содержать только латинские буквы, цифры и дефисы",
      title,
      slug,
      excerpt: null,
      body,
      imageUrl: null,
      published: input.published,
    };
  }

  return {
    title,
    slug,
    excerpt: toNullable(input.excerpt),
    body,
    imageUrl: toNullable(input.imageUrl),
    published: input.published,
  };
}

export async function createArticle(input: ArticleInput): Promise<ArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const parsed = validateArticleInput(input);
    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    if (await slugTaken(parsed.slug)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }

    const data = await prisma.article.create({
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        body: parsed.body,
        imageUrl: parsed.imageUrl,
        published: parsed.published,
      },
    });

    revalidateArticlePaths(data.slug);

    return { success: true, data };
  } catch (error) {
    if (isUniqueError(error)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }
    console.error("Ошибка при создании статьи:", error);
    return { success: false, error: "Не удалось сохранить статью" };
  }
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
): Promise<ArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Статья не найдена" };
    }

    const parsed = validateArticleInput(input);
    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    if (await slugTaken(parsed.slug, id)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }

    const data = await prisma.article.update({
      where: { id },
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        body: parsed.body,
        imageUrl: parsed.imageUrl,
        published: parsed.published,
      },
    });

    revalidateArticlePaths(current.slug);
    if (current.slug !== data.slug) {
      revalidateArticlePaths(data.slug);
    }

    return { success: true, data };
  } catch (error) {
    if (isUniqueError(error)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }
    console.error("Ошибка при обновлении статьи:", error);
    return { success: false, error: "Не удалось сохранить статью" };
  }
}

export async function deleteArticle(id: string): Promise<DeleteArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Статья не найдена" };
    }

    await prisma.article.delete({ where: { id } });
    revalidateArticlePaths(current.slug);

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении статьи:", error);
    return { success: false, error: "Не удалось удалить статью" };
  }
}
