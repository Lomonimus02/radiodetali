import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getPublishedArticleBySlug } from "@/app/actions";
import { parseArticleBody, stripArticleTables } from "@/lib/article-body";
import { parseBoldSegments } from "@/lib/category-info";
import { BoldText } from "../../components/BoldText";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://драгсоюз.рф";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function descriptionFromArticle(excerpt: string | null, body: string): string {
  const raw = (excerpt?.trim() || stripArticleTables(body).replace(/\*\*/g, ""))
    .replace(/\s+/g, " ")
    .trim();
  if (raw.length <= 160) return raw;
  return `${raw.slice(0, 160).trimEnd()}…`;
}

function ArticleCellText({ text }: { text: string }) {
  return (
    <>
      {parseBoldSegments(text).map((segment, index) =>
        segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}

function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    return { title: "Статья не найдена" };
  }

  const description = descriptionFromArticle(article.excerpt, article.body);
  const canonical = `${BASE_URL}/blog/${article.slug}`;

  return {
    title: article.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: canonical,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const blocks = parseArticleBody(article.body);
  const lead = article.excerpt?.trim() ?? "";

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="border-b border-[var(--gray-200)] bg-white">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 overflow-x-auto text-sm text-[var(--gray-500)]">
            <Link href="/" className="whitespace-nowrap hover:text-[var(--primary-600)]">
              Главная
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link href="/blog" className="whitespace-nowrap hover:text-[var(--primary-600)]">
              Полезная информация
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium text-[var(--gray-900)]">{article.title}</span>
          </nav>
        </div>
      </div>

      <article className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--primary-700)]">
          Статья
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--gray-900)] md:text-4xl">
          {article.title}
        </h1>
        <time
          dateTime={article.createdAt.toISOString()}
          className="mt-4 block text-sm text-[var(--gray-500)]"
        >
          {formatArticleDate(article.createdAt)}
        </time>

        {lead ? (
          <p className="mt-6 border-l-4 border-[var(--accent-400)] pl-4 text-lg leading-relaxed text-[var(--gray-700)]">
            {lead}
          </p>
        ) : null}

        {article.imageUrl ? (
          <figure className="mt-8 overflow-hidden rounded-2xl bg-[var(--gray-100)]">
            <Image
              src={article.imageUrl}
              alt=""
              width={1200}
              height={675}
              priority
              className="h-auto w-full object-cover"
            />
          </figure>
        ) : null}

        <div className="mt-8 space-y-5 text-[17px] leading-8 text-[var(--gray-800)]">
          {blocks.map((block, index) =>
            block.kind === "paragraph" ? (
              <BoldText
                key={index}
                text={block.text}
                className="whitespace-pre-wrap"
              />
            ) : (
              <div
                key={index}
                className="overflow-x-auto rounded-xl border border-[var(--gray-200)] bg-white"
              >
                <table className="w-full min-w-[20rem] border-collapse text-left text-base leading-6">
                  <thead className="bg-[var(--gray-100)] text-[var(--gray-900)]">
                    <tr>
                      {block.header.map((cell, cellIndex) => (
                        <th
                          key={cellIndex}
                          className="border-b border-[var(--gray-200)] px-4 py-3 font-semibold"
                        >
                          <ArticleCellText text={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-t border-[var(--gray-200)] odd:bg-white even:bg-[var(--gray-50)]"
                      >
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 align-top">
                            <ArticleCellText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </div>

        <div className="mt-12 border-t border-[var(--gray-200)] pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-medium text-[var(--primary-700)] hover:text-[var(--primary-900)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Все статьи
          </Link>
        </div>
      </article>
    </div>
  );
}
