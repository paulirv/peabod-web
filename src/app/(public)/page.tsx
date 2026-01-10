import { getDB } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import ArticleCard from "@/components/ArticleCard";


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
  tags?: Tag[];
}

async function getArticles(): Promise<Article[]> {
  try {
    const db = getDB();
    const { results } = await db
      .prepare(
        `SELECT a.*, m.path as media_path, m.alt as media_alt,
                m.width as media_width, m.height as media_height
         FROM articles a
         LEFT JOIN media m ON a.media_id = m.id
         WHERE a.published = 1
         ORDER BY a.authored_on DESC, a.id DESC LIMIT 20`
      )
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
    console.error("Error fetching articles:", error);
    return [];
  }
}

export default async function Home() {
  const [articles, admin] = await Promise.all([getArticles(), isAdmin()]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
          Welcome to Peabod
        </h1>
        <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
          Thoughts, ideas, and stories from my corner of the internet.
        </p>
      </div>

      {articles.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: "var(--muted)" }}
        >
          <p style={{ color: "var(--muted-foreground)" }}>
            No articles yet. Check back soon!
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
