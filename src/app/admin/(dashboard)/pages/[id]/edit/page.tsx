"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/admin/Editor";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface PageData {
  id: number;
  title: string;
  slug: string;
  author: string;
  authored_on: string;
  body: string;
  media_id: number | null;
  published: boolean;
  tags?: Tag[];
  tag_ids?: number[];
  [key: string]: unknown;
}

const pageFields = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true },
  { name: "author", label: "Author", type: "text" as const, required: true },
  { name: "authored_on", label: "Date", type: "date" as const, required: true },
  { name: "media_id", label: "Featured Media", type: "media" as const },
  { name: "tag_ids", label: "Tags", type: "tags" as const },
  { name: "body", label: "Content", type: "wysiwyg" as const, required: true },
  { name: "published", label: "Published", type: "checkbox" as const },
];

export default function EditPagePage() {
  const params = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/admin/api/pages/${params.id}`);
        const data = (await res.json()) as { success: boolean; data?: PageData };
        if (data.success && data.data) {
          // Transform tags array to tag_ids array for the Editor
          const pageData = {
            ...data.data,
            tag_ids: data.data.tags?.map((tag) => tag.id) || [],
          };
          setPage(pageData);
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
