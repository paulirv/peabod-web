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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Dashboard() {
  const [articles, pages, tags] = await Promise.all([
    getRecentArticles(),
    getRecentPages(),
    getRecentTags(),
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
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
