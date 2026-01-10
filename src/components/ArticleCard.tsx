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
  tags?: Tag[];
  isAdmin?: boolean;
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
  tags,
  isAdmin,
}: ArticleCardProps) {
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
      {media_path && (
        <Link href={`/article/${slug}`} className="block">
          <ResponsiveImageContainer
            path={media_path}
            alt={media_alt || title}
            preset="card"
            aspectRatio="auto"
            containerClassName="h-48 w-full"
          />
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
