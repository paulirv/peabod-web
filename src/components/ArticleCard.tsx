import Link from "next/link";
import { ResponsiveImageContainer } from "./ResponsiveImage";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface ArticleCardProps {
  id: number;
  slug: string;
  title: string;
  author: string;
  authored_on: string;
  body: string;
  media_path?: string;
  media_alt?: string;
  media_width?: number;
  media_height?: number;
  media_type?: "image" | "video";
  media_thumbnail_url?: string;
  tags?: Tag[];
  isAdmin?: boolean;
  /** Set to true for above-the-fold images (LCP optimization) */
  priority?: boolean;
}

export default function ArticleCard({
  id,
  slug,
  title,
  author,
  authored_on,
  body,
  media_path,
  media_alt,
  media_type,
  media_thumbnail_url,
  tags,
  isAdmin,
  priority = false,
}: ArticleCardProps) {
  const isVideo = media_type === "video";
  const excerpt = body.length > 200 ? body.substring(0, 200) + "..." : body;
  const formattedDate = new Date(authored_on).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article
      className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Featured Media - Image or Video Thumbnail */}
      {(media_path || (isVideo && media_thumbnail_url)) && (
        <Link href={`/article/${slug}`} className="block relative">
          {isVideo && media_thumbnail_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media_thumbnail_url}
                alt={media_alt || title}
                className="h-48 w-full object-cover"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          ) : media_path ? (
            <ResponsiveImageContainer
              path={media_path}
              alt={media_alt || title}
              preset="card"
              aspectRatio="auto"
              containerClassName="h-48 w-full"
              priority={priority}
            />
          ) : null}
        </Link>
      )}
      <div className="p-6">
        <Link href={`/article/${slug}`}>
          <h2
            className="text-xl font-semibold transition-colors mb-2"
            style={{ color: "var(--card-foreground)" }}
          >
            {title}
          </h2>
        </Link>
        <div
          className="flex items-center gap-2 text-sm mb-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          <span>{author}</span>
          <span>&middot;</span>
          <time dateTime={authored_on}>{formattedDate}</time>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs rounded-full"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--secondary-foreground)",
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <p style={{ color: "var(--muted-foreground)" }} className="leading-relaxed">
          {excerpt}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Link
            href={`/article/${slug}`}
            className="text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            Read more &rarr;
          </Link>
          {isAdmin && (
            <a
              href={`/admin/articles/${id}/edit`}
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--secondary)",
                color: "var(--secondary-foreground)",
              }}
            >
              Edit
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
