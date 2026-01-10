"use client";

import { useEffect, useState, FormEvent } from "react";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/admin/api/tags");
      const data = (await res.json()) as { success: boolean; data?: Tag[] };
      if (data.success && data.data) {
        setTags(data.data);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTag.name || !newTag.slug) return;

    setSaving(true);
    try {
      const res = await fetch("/admin/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });
      if (res.ok) {
        setNewTag({ name: "", slug: "" });
        fetchTags();
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/admin/api/tags/${tag.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tags</h1>

      <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Tag</h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            placeholder="Tag name"
            value={newTag.name}
            onChange={(e) =>
              setNewTag({
                name: e.target.value,
                slug: generateSlug(e.target.value),
              })
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          />
          <input
            type="text"
            placeholder="Slug"
            value={newTag.slug}
            onChange={(e) => setNewTag({ ...newTag, slug: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          />
          <button
            type="submit"
            disabled={saving || !newTag.name || !newTag.slug}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : "Add Tag"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tags.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No tags yet. Create your first tag above.
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tag.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleDelete(tag)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
