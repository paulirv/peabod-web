"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/admin/Editor";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface ArticleData {
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

const articleFields = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true },
  { name: "author", label: "Author", type: "text" as const, required: true },
  { name: "authored_on", label: "Date", type: "date" as const, required: true },
  { name: "media_id", label: "Featured Media", type: "media" as const },
  { name: "tag_ids", label: "Tags", type: "tags" as const },
  { name: "body", label: "Content", type: "textarea" as const, required: true },
  { name: "published", label: "Published", type: "checkbox" as const },
];

export default function EditArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/admin/api/articles/${params.id}`);
        const data = (await res.json()) as { success: boolean; data?: ArticleData };
        if (data.success && data.data) {
          // Transform tags array to tag_ids array for the Editor
          const articleData = {
            ...data.data,
            tag_ids: data.data.tags?.map((tag) => tag.id) || [],
          };
          setArticle(articleData);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!article) {
    return <div className="text-center py-8">Article not found</div>;
  }

  return (
    <Editor
      fields={articleFields}
      initialData={article}
      apiEndpoint={`/admin/api/articles/${params.id}`}
      method="PUT"
      redirectPath="/admin/articles"
      title="Edit Article"
    />
  );
}
