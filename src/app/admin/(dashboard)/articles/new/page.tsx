"use client";

import Editor from "@/components/admin/Editor";

const articleFields = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true },
  { name: "author", label: "Author", type: "text" as const, required: true },
  { name: "authored_on", label: "Date", type: "date" as const, required: true },
  { name: "media_id", label: "Featured Media", type: "media" as const },
  { name: "body", label: "Content", type: "textarea" as const, required: true },
  { name: "published", label: "Published", type: "checkbox" as const },
];

export default function NewArticlePage() {
  const today = new Date().toISOString().split("T")[0];

  return (
    <Editor
      fields={articleFields}
      initialData={{ authored_on: today }}
      apiEndpoint="/admin/api/articles"
      method="POST"
      redirectPath="/admin/articles"
      title="New Article"
    />
  );
}
