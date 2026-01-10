import { getDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";


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
  updated_at: string;
  tags?: Tag[];
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const db = getDB();
    const article = await db
      .prepare(
        `SELECT a.*, m.path as media_path, m.alt as media_alt,
                m.width as media_width, m.height as media_height
         FROM articles a
         LEFT JOIN media m ON a.media_id = m.id
         WHERE a.slug = ? AND a.published = 1`
      )
      .bind(slug)
      .first<Article>();

    if (!article) return null;

    // Get tags
    const { results: tags } = await db
      .prepare(
        `SELECT t.* FROM tags t
         JOIN article_tags at ON t.id = at.tag_id
         WHERE at.article_id = ?`
      )
      .bind(article.id)
      .all();

    return { ...article, tags: (tags || []) as unknown as Tag[] };
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  return {
    title: `${article.title} | Peabod`,
    description: article.body.substring(0, 160),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, user] = await Promise.all([getArticle(slug), getSessionUser()]);

  if (!article) {
    notFound();
  }

  const canEdit = user && (user.role === "admin" || user.role === "editor");

  const formattedDate = new Date(article.authored_on).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          &larr; Back to all articles
        </Link>
        {canEdit && (
          <Link
            href={`/admin/articles/${article.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Edit Article
          </Link>
        )}
      </div>

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>
        <div className="flex items-center gap-2 text-gray-500">
          <span>{article.author}</span>
          <span>&middot;</span>
          <time dateTime={article.authored_on}>{formattedDate}</time>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {article.media_path && (
        <figure className="mb-8 relative aspect-video">
          <Image
            src={`/api/media/${article.media_path}`}
            alt={article.media_alt || article.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="rounded-lg shadow-md object-cover"
            unoptimized
            priority
          />
        </figure>
      )}

      <div className="prose prose-lg max-w-none">
        {article.body.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
