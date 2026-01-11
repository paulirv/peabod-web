import Editor from "@/components/admin/Editor";
import { getSessionUser } from "@/lib/session";

const pageFields = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug (auto-generated if empty)", type: "text" as const },
  { name: "author", label: "Author", type: "text" as const, required: true },
  { name: "authored_on", label: "Date", type: "date" as const, required: true },
  { name: "media_id", label: "Featured Media", type: "media" as const },
  { name: "body", label: "Content", type: "textarea" as const, required: true },
  { name: "published", label: "Published", type: "checkbox" as const },
];

export default async function NewPagePage() {
  const user = await getSessionUser();
  const today = new Date().toISOString().split("T")[0];

  return (
    <Editor
      fields={pageFields}
      initialData={{ authored_on: today, author: user?.name || "" }}
      apiEndpoint="/admin/api/pages"
      method="POST"
      redirectPath="/admin/pages"
      title="New Page"
    />
  );
}
