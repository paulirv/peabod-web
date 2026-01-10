import { getDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Page {
  id: number;
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const db = getDB();
    const page = await db
      .prepare("SELECT * FROM pages WHERE slug = ? AND published = 1")
      .bind(slug)
      .first<Page>();

    return page || null;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: `${page.title} | Peabod`,
    description: page.body.substring(0, 160),
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, user] = await Promise.all([getPage(slug), getSessionUser()]);

  if (!page) {
    notFound();
  }

  const canEdit = user && (user.role === "admin" || user.role === "editor");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{page.title}</h1>
        {canEdit && (
          <Link
            href={`/admin/pages/${page.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Edit Page
          </Link>
        )}
      </div>
      <div className="prose prose-lg max-w-none">
        {page.body.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
