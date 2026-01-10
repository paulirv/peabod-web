"use client";

import Editor from "@/components/admin/Editor";

const pageFields = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true },
  { name: "author", label: "Author", type: "text" as const, required: true },
  { name: "authored_on", label: "Date", type: "date" as const, required: true },
  { name: "media_id", label: "Featured Image", type: "media" as const },
  { name: "body", label: "Content", type: "textarea" as const, required: true },
  { name: "published", label: "Published", type: "checkbox" as const },
];

export default function NewPagePage() {
  const today = new Date().toISOString().split("T")[0];

  return (
    <Editor
      fields={pageFields}
      initialData={{ authored_on: today, author: "Paul Irving" }}
      apiEndpoint="/admin/api/pages"
      method="POST"
      redirectPath="/admin/pages"
      title="New Page"
    />
  );
}
