"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/admin/DataTable";

interface Page {
  id: number;
  slug: string;
  title: string;
  author: string;
  authored_on: string;
  published: boolean;
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch("/admin/api/pages");
      const data = (await res.json()) as { success: boolean; data?: Page[] };
      if (data.success && data.data) {
        setPages(data.data);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Are you sure you want to delete "${page.title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/pages/${page.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPages();
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const columns = [
    {
      key: "title" as const,
      label: "Title",
      render: (item: Page) => (
        <a
          href={`/${item.slug}`}
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
    {
      key: "published" as const,
      label: "Status",
      render: (item: Page) => (
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
        <h1 className="text-2xl font-bold">Pages</h1>
        <Link
          href="/admin/pages/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Page
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={pages}
        editPath={(item) => `/admin/pages/${item.id}/edit`}
        onDelete={handleDelete}
      />
    </div>
  );
}
