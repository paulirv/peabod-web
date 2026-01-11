"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveImageContainer } from "@/components/ResponsiveImage";
import MediaMetadataEditor from "./MediaMetadataEditor";
import TagSelector from "./TagSelector";

interface EditorField {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "checkbox" | "select" | "image" | "media" | "tags";
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

interface EditorProps {
  fields: EditorField[];
  initialData?: Record<string, unknown>;
  apiEndpoint: string;
  method?: "POST" | "PUT";
  redirectPath: string;
  title: string;
}

export default function Editor({
  fields,
  initialData = {},
  apiEndpoint,
  method = "POST",
  redirectPath,
  title,
}: EditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (fieldName: string, file: File) => {
    setUploading(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/admin/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const result = (await response.json()) as { success: boolean; key?: string; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setFormData((prev) => ({
        ...prev,
        [fieldName]: result.key,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = (fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Failed to save");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                value={(formData[field.name] as string) || ""}
                onChange={handleChange}
                required={field.required}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={(formData[field.name] as boolean) || false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                value={(formData[field.name] as string) || ""}
                onChange={handleChange}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "media" ? (
              <MediaMetadataEditor
                mediaId={(formData[field.name] as number | null) || null}
                onMediaChange={(mediaId) =>
                  setFormData((prev) => ({ ...prev, [field.name]: mediaId }))
                }
              />
            ) : field.type === "tags" ? (
              <TagSelector
                selectedTagIds={(formData[field.name] as number[]) || []}
                onChange={(tagIds) =>
                  setFormData((prev) => ({ ...prev, [field.name]: tagIds }))
                }
              />
            ) : field.type === "image" ? (
              <div className="space-y-3">
                {uploading ? (
                  <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">Uploading image...</p>
                    </div>
                  </div>
                ) : formData[field.name] ? (
                  <div className="relative inline-block max-w-xs">
                    <ResponsiveImageContainer
                      path={formData[field.name] as string}
                      alt="Preview"
                      preset="mediaPreview"
                      containerClassName="h-48 w-full rounded-lg border border-gray-300"
                      objectFit="contain"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(field.name)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                ) : null}
                {!uploading && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(field.name, file);
                      }}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={(formData[field.name] as string) || ""}
                onChange={handleChange}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            )}
          </div>
        ))}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
