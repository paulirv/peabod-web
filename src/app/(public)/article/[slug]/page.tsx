import { getDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getCustomerSubdomain } from "@/lib/stream";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResponsiveImageContainer } from "@/components/ResponsiveImage";
import StreamPlayer from "@/components/StreamPlayer";
import { getImageUrl } from "@/lib/image";
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
  media_stream_uid?: string;
  media_thumbnail_url?: string;
  media_stream_status?: string;
  updated_at: string;
  tags?: Tag[];
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const db = getDB();
    const article = await db
      .prepare(
        `SELECT a.*, m.path as media_path, m.alt as media_alt,
                m.width as media_width, m.height as media_height,
                m.type as media_type, m.stream_uid as media_stream_uid,
                m.thumbnail_url as media_thumbnail_url,
                m.stream_status as media_stream_status
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
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  const description = article.body.substring(0, 160).trim() + "...";
  const url = `https://peabod.com/article/${slug}`;

  // Generate OG image URL (1200x630 is the standard for social sharing)
  // For videos, use the thumbnail; for images, use the image path
  const ogImage = article.media_type === "video" && article.media_thumbnail_url
    ? article.media_thumbnail_url
    : article.media_path
      ? getImageUrl(article.media_path, {
          width: 1200,
          height: 630,
          fit: "cover",
          quality: 70,
        })
      : undefined;

  return {
    title: article.title,
    description,
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url,
      siteName: "Peabod",
      publishedTime: article.authored_on,
      modifiedTime: article.updated_at,
      authors: [article.author],
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: article.media_alt || article.title,
          },
        ],
      }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: article.title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
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
  const isVideo = article.media_type === "video";
  const customerSubdomain = isVideo ? getCustomerSubdomain() : null;

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
          className="inline-flex items-center text-primary hover:text-accent"
        >
          &larr; Back to all articles
        </Link>
        {canEdit && (
          <Link
            href={`/admin/articles/${article.id}/edit`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            Edit Article
          </Link>
        )}
      </div>

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {article.title}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{article.author}</span>
          <span>&middot;</span>
          <time dateTime={article.authored_on}>{formattedDate}</time>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full hover:opacity-80 transition-opacity"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Featured Media - Image or Video */}
      {article.media_id && (
        <figure className="mb-8">
          {isVideo && article.media_stream_uid && article.media_stream_status === "ready" && customerSubdomain ? (
            <StreamPlayer
              uid={article.media_stream_uid}
              customerSubdomain={customerSubdomain}
              title={article.title}
              poster={article.media_thumbnail_url || undefined}
              controls
              className="rounded-lg shadow-md overflow-hidden"
            />
          ) : isVideo ? (
            <div className="aspect-video bg-gray-100 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-gray-500">
                {article.media_stream_status === "processing" ? "Video processing..." : "Video not available"}
              </span>
            </div>
          ) : article.media_path ? (
            <ResponsiveImageContainer
              path={article.media_path}
              alt={article.media_alt || article.title}
              preset="hero"
              priority
              containerClassName="rounded-lg shadow-md"
            />
          ) : null}
        </figure>
      )}

      <div className="prose prose-lg max-w-none">
        {article.body.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4 text-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
