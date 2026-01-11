import Link from "next/link";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Article {
  id: number;
  title: string;
  author: string;
  authored_on: string;
}

interface Page {
  id: number;
  title: string;
  author: string;
  authored_on: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface MediaItem {
  id: number;
  title: string;
  filename: string;
  path: string;
  type: "image" | "video";
  thumbnail_url: string | null;
  created_at: string;
}

async function getRecentArticles(): Promise<Article[]> {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT id, title, author, authored_on FROM articles ORDER BY authored_on DESC LIMIT 5")
    .all();
  return (results || []) as unknown as Article[];
}

async function getRecentPages(): Promise<Page[]> {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT id, title, author, authored_on FROM pages ORDER BY authored_on DESC LIMIT 5")
    .all();
  return (results || []) as unknown as Page[];
}

async function getRecentTags(): Promise<Tag[]> {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT id, name, slug FROM tags ORDER BY id DESC LIMIT 5")
    .all();
  return (results || []) as unknown as Tag[];
}

async function getRecentMedia(): Promise<MediaItem[]> {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT id, title, filename, path, type, thumbnail_url, created_at FROM media ORDER BY created_at DESC LIMIT 5")
    .all();
  return (results || []) as unknown as MediaItem[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Dashboard() {
  const [articles, pages, tags, media] = await Promise.all([
    getRecentArticles(),
    getRecentPages(),
    getRecentTags(),
    getRecentMedia(),
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          target="_blank"
        >
          View Site &rarr;
        </Link>
      </div>

      {/* Articles and Pages Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Articles Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <Link href="/admin/articles" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              Articles
            </Link>
            <Link
              href="/admin/articles/new"
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              + New
            </Link>
          </div>
          {articles.length > 0 ? (
            <ul className="space-y-3">
              {articles.map((article) => (
                <li key={article.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="text-sm font-medium text-gray-800 hover:text-blue-600"
                  >
                    {article.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {article.author} &middot; {formatDate(article.authored_on)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No articles yet</p>
          )}
        </div>

        {/* Pages Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <Link href="/admin/pages" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              Pages
            </Link>
            <Link
              href="/admin/pages/new"
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              + New
            </Link>
          </div>
          {pages.length > 0 ? (
            <ul className="space-y-3">
              {pages.map((page) => (
                <li key={page.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
                    className="text-sm font-medium text-gray-800 hover:text-blue-600"
                  >
                    {page.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {page.author} &middot; {formatDate(page.authored_on)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No pages yet</p>
          )}
        </div>
      </div>

      {/* Tags and Media Library Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Tags Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <Link href="/admin/tags" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              Tags
            </Link>
            <Link
              href="/admin/tags"
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              + New
            </Link>
          </div>
          {tags.length > 0 ? (
            <ul className="space-y-3">
              {tags.map((tag) => (
                <li key={tag.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <Link
                    href="/admin/tags"
                    className="text-sm font-medium text-gray-800 hover:text-blue-600"
                  >
                    {tag.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    /{tag.slug}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No tags yet</p>
          )}
        </div>

        {/* Media Library Card */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <Link href="/admin/media" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
            Media Library
          </Link>
          <Link
            href="/admin/media"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            + New
          </Link>
        </div>
        {media.length > 0 ? (
          <ul className="space-y-3">
            {media.map((item) => (
              <li key={item.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0 flex items-center gap-3">
                <Link href="/admin/media" className="shrink-0">
                  {item.type === "video" && item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title || item.filename}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <img
                      src={`/api/media/${item.path}?w=48&h=48&fit=cover`}
                      alt={item.title || item.filename}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </Link>
                <div className="min-w-0">
                  <Link
                    href="/admin/media"
                    className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate block"
                  >
                    {item.title || item.filename}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.type === "video" ? "Video" : "Image"} &middot; {formatDate(item.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No media yet</p>
        )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Start</h2>
        <ul className="space-y-2 text-gray-600">
          <li>
            1. <Link href="/admin/articles/new" className="text-blue-600 hover:underline">Create your first article</Link> in the Articles section
          </li>
          <li>
            2. <Link href="/admin/tags" className="text-blue-600 hover:underline">Add tags</Link> to categorize your content
          </li>
          <li>
            3. <Link href="/admin/pages/new" className="text-blue-600 hover:underline">Create static pages</Link> like About or Contact
          </li>
          <li>
            4. Publish content to make it visible on the frontend
          </li>
        </ul>
      </div>
    </div>
  );
}
