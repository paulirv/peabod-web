"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface TagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

export default function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

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

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading tags...</div>;
  }

  if (tags.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No tags available.{" "}
        <Link href="/admin/tags" className="text-blue-600 hover:underline">
          Create tags
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              isSelected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
