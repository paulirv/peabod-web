"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/admin/DataTable";

interface Article {
  id: number;
  slug: string;
  title: string;
  author: string;
  authored_on: string;
  published: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: { items: Article[] };
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/admin/api/articles");
      const data = (await res.json()) as ApiResponse;
      if (data.success && data.data) {
        setArticles(data.data.items || []);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/articles/${article.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  const columns = [
    {
      key: "title" as const,
      label: "Title",
      render: (item: Article) => (
        <a
          href={`/article/${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {item.title}
        </a>
      ),
    },
    { key: "slug" as const, label: "Slug" },
    { key: "author" as const, label: "Author" },
    { key: "authored_on" as const, label: "Date" },
    {
      key: "published" as const,
      label: "Status",
      render: (item: Article) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.published
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {item.published ? "Published" : "Draft"}
        </span>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Article
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={articles}
        editPath={(item) => `/admin/articles/${item.id}/edit`}
        onDelete={handleDelete}
      />
    </div>
  );
}
