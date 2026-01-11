import { getDB } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { Metadata } from "next";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  media_id?: number;
  media_path?: string;
  media_alt?: string;
  media_width?: number;
  media_height?: number;
  media_type?: "image" | "video";
  media_thumbnail_url?: string;
  tags?: Tag[];
}

async function getTag(slug: string): Promise<Tag | null> {
  try {
    const db = getDB();
    const tag = await db
      .prepare("SELECT * FROM tags WHERE slug = ?")
      .bind(slug)
      .first<Tag>();
    return tag || null;
  } catch (error) {
    console.error("Error fetching tag:", error);
    return null;
  }
}

async function getArticlesByTag(tagId: number): Promise<Article[]> {
  try {
    const db = getDB();
    const { results } = await db
      .prepare(
        `SELECT a.*, m.path as media_path, m.alt as media_alt,
                m.width as media_width, m.height as media_height,
                m.type as media_type, m.thumbnail_url as media_thumbnail_url
         FROM articles a
         JOIN article_tags at ON a.id = at.article_id
         LEFT JOIN media m ON a.media_id = m.id
         WHERE at.tag_id = ? AND a.published = 1
         ORDER BY a.authored_on DESC, a.id DESC`
      )
      .bind(tagId)
      .all();

    // Get tags for each article
    const articlesWithTags = await Promise.all(
      (results || []).map(async (article: unknown) => {
        const art = article as Article;
        const { results: tags } = await db
          .prepare(
            `SELECT t.* FROM tags t
             JOIN article_tags at ON t.id = at.tag_id
             WHERE at.article_id = ?`
          )
          .bind(art.id)
          .all();
        return { ...art, tags: (tags || []) as unknown as Tag[] };
      })
    );

    return articlesWithTags;
  } catch (error) {
    console.error("Error fetching articles by tag:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    return { title: "Tag Not Found" };
  }

  return {
    title: tag.name,
    description: `Articles tagged with "${tag.name}"`,
    openGraph: {
      type: "website",
      title: tag.name,
      description: `Articles tagged with "${tag.name}"`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tag, admin] = await Promise.all([getTag(slug), isAdmin()]);

  if (!tag) {
    notFound();
  }

  const articles = await getArticlesByTag(tag.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-accent"
        >
          &larr; Back to all articles
        </Link>
        {admin && (
          <Link
            href={`/admin/tags/${tag.id}`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            Edit Tag
          </Link>
        )}
      </div>

      <div className="mb-12">
        <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          {tag.name}
        </h1>
        <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </p>
      </div>

      {articles.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: "var(--muted)" }}
        >
          <p style={{ color: "var(--muted-foreground)" }}>
            No published articles with this tag yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              {...article}
              isAdmin={admin}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
