import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface ArticleCardProps {
  slug: string;
  title: string;
  author: string;
  authored_on: string;
  body: string;
  image?: string;
  tags?: Tag[];
}

export default function ArticleCard({
  slug,
  title,
  author,
  authored_on,
  body,
  image,
  tags,
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
      {image && (
        <Link href={`/article/${slug}`}>
          <img
            src={`/api/media/${image}`}
            alt={title}
            className="w-full h-48 object-cover"
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
        <Link
          href={`/article/${slug}`}
          className="inline-block mt-4 text-sm font-medium"
          style={{ color: "var(--primary)" }}
        >
          Read more &rarr;
        </Link>
      </div>
    </article>
  );
}
