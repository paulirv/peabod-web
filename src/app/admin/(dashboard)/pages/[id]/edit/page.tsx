"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/admin/Editor";

const pageFields = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true },
  { name: "author", label: "Author", type: "text" as const, required: true },
  { name: "authored_on", label: "Date", type: "date" as const, required: true },
  { name: "media_id", label: "Featured Media", type: "media" as const },
  { name: "body", label: "Content", type: "textarea" as const, required: true },
  { name: "published", label: "Published", type: "checkbox" as const },
];

export default function EditPagePage() {
  const params = useParams();
  const [page, setPage] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/admin/api/pages/${params.id}`);
        const data = (await res.json()) as { success: boolean; data?: Record<string, unknown> };
        if (data.success && data.data) {
          setPage(data.data);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!page) {
    return <div className="text-center py-8">Page not found</div>;
  }

  return (
    <Editor
      fields={pageFields}
      initialData={page}
      apiEndpoint={`/admin/api/pages/${params.id}`}
      method="PUT"
      redirectPath="/admin/pages"
      title="Edit Page"
    />
  );
}
