import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getPublishedArticleBySlug } from "@/app/actions";
import { BoldText } from "../../components/BoldText";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://драгсоюз.рф";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function descriptionFromArticle(excerpt: string | null, body: string): string {
  const raw = (excerpt?.trim() || body.replace(/\*\*/g, "")).replace(/\s+/g, " ").trim();
  if (raw.length <= 160) return raw;
  return `${raw.slice(0, 160).trimEnd()}…`;
}

function articleParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
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

  const paragraphs = articleParagraphs(article.body);
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
          {paragraphs.map((paragraph, index) => (
            <BoldText
              key={index}
              text={paragraph}
              className="whitespace-pre-wrap"
            />
          ))}
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
