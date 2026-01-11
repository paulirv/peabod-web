"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ResponsiveImageContainer } from "@/components/ResponsiveImage";

interface Article {
  id: number;
  slug: string;
  title: string;
  author: string;
  authored_on: string;
  published: boolean;
}

interface Page {
  id: number;
  slug: string;
  title: string;
  author: string;
  authored_on: string;
  published: boolean;
}

interface Media {
  id: number;
  title: string;
  filename: string;
  path: string;
  type: string;
  created_at: string;
}

interface TagDetail {
  id: number;
  name: string;
  slug: string;
  article_count: number;
  page_count: number;
  media_count: number;
  articles: Article[];
  pages: Page[];
  media: Media[];
}

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tag, setTag] = useState<TagDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"articles" | "pages" | "media">("articles");

  const fetchTag = useCallback(async () => {
    try {
      const res = await fetch(`/admin/api/tags/${params.id}`);
      const data = (await res.json()) as { success: boolean; data?: TagDetail };
      if (data.success && data.data) {
        setTag(data.data);
        setEditForm({ name: data.data.name, slug: data.data.slug });
      }
    } catch (error) {
      console.error("Error fetching tag:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.slug) return;

    setSaving(true);
    try {
      const res = await fetch(`/admin/api/tags/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditing(false);
        fetchTag();
      }
    } catch (error) {
      console.error("Error updating tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tag) return;
    const totalUsage = tag.article_count + tag.page_count + tag.media_count;
    const warningMsg = totalUsage > 0
      ? `"${tag.name}" is used by ${totalUsage} item(s). Deleting it will remove the tag from all content. Are you sure?`
      : `Are you sure you want to delete "${tag.name}"?`;

    if (!confirm(warningMsg)) return;

    try {
      const res = await fetch(`/admin/api/tags/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/tags");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!tag) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Tag not found</p>
        <Link href="/admin/tags" className="text-blue-600 hover:text-blue-800">
          Back to Tags
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tags"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Tag: {tag.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/tag/${tag.slug}`}
            target="_blank"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            View Public Page
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tag Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditForm({ name: tag.name, slug: tag.slug });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-gray-500">Slug:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-900">{tag.slug}</code>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tag.article_count}</div>
                  <div className="text-sm text-gray-500">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tag.page_count}</div>
                  <div className="text-sm text-gray-500">Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{tag.media_count}</div>
                  <div className="text-sm text-gray-500">Media</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("articles")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "articles"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Articles ({tag.article_count})
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pages"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pages ({tag.page_count})
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "media"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Media ({tag.media_count})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "articles" && (
            <div>
              {tag.articles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No articles with this tag</p>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tag.articles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/article/${article.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {article.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{article.author}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{article.authored_on}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            article.published
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {article.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "pages" && (
            <div>
              {tag.pages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pages with this tag</p>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tag.pages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/${page.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {page.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{page.author}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{page.authored_on}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            page.published
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {page.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Link
                            href={`/admin/pages/${page.id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div>
              {tag.media.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No media with this tag</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {tag.media.map((item) => (
                    <Link
                      key={item.id}
                      href={`/admin/media`}
                      className="block group"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        {item.type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        ) : (
                          <ResponsiveImageContainer
                            path={item.path}
                            alt={item.title}
                            preset="tableThumb"
                            containerClassName="w-full h-full"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                      </div>
                      <p className="mt-2 text-xs text-gray-600 truncate">{item.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
