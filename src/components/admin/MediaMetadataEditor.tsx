"use client";

import { useState, useEffect, useCallback } from "react";
import type { Media } from "@/types/media";

interface MediaMetadataEditorProps {
  mediaId: number | null;
  onMediaChange: (mediaId: number | null) => void;
  onUploadComplete?: (media: Media) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaMetadataEditor({
  mediaId,
  onMediaChange,
  onUploadComplete,
}: MediaMetadataEditorProps) {
  const [media, setMedia] = useState<Media | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    alt: "",
    lat: "",
    lon: "",
    date_taken: "",
  });

  // Fetch media data when mediaId changes
  useEffect(() => {
    if (mediaId) {
      fetchMedia(mediaId);
    } else {
      setMedia(null);
      setExpanded(false);
    }
  }, [mediaId]);

  const fetchMedia = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/admin/api/media/${id}`);
      const data = (await res.json()) as { success: boolean; data?: Media; error?: string };
      if (data.success && data.data) {
        setMedia(data.data);
        setEditForm({
          title: data.data.title || "",
          alt: data.data.alt || "",
          lat: data.data.lat?.toString() || "",
          lon: data.data.lon?.toString() || "",
          date_taken: data.data.date_taken
            ? data.data.date_taken.split("T")[0]
            : "",
        });
      } else {
        setError("Failed to load media");
      }
    } catch {
      setError("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/admin/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { success: boolean; data?: Media; error?: string };

        if (data.success && data.data) {
          setMedia(data.data);
          onMediaChange(data.data.id);
          setEditForm({
            title: data.data.title || "",
            alt: data.data.alt || "",
            lat: data.data.lat?.toString() || "",
            lon: data.data.lon?.toString() || "",
            date_taken: data.data.date_taken
              ? data.data.date_taken.split("T")[0]
              : "",
          });
          onUploadComplete?.(data.data);
          setExpanded(true);
        } else {
          setError(data.error || "Upload failed");
        }
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = "";
      }
    },
    [onMediaChange, onUploadComplete]
  );

  const handleSave = async () => {
    if (!media) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/admin/api/media/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          alt: editForm.alt || null,
          lat: editForm.lat ? parseFloat(editForm.lat) : null,
          lon: editForm.lon ? parseFloat(editForm.lon) : null,
          date_taken: editForm.date_taken || null,
        }),
      });

      const data = (await res.json()) as { success: boolean; data?: Media; error?: string };

      if (data.success && data.data) {
        setMedia(data.data);
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    setMedia(null);
    onMediaChange(null);
    setExpanded(false);
    setEditForm({
      title: "",
      alt: "",
      lat: "",
      lon: "",
      date_taken: "",
    });
  };

  // No media selected - show upload UI
  if (!media && !loading) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-6">
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600">No image selected</p>
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                Upload Image
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 flex justify-center">
        <svg
          className="animate-spin h-6 w-6 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  // Media selected - show expandable editor
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <div
        className="flex items-center gap-4 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          {media?.type === "video" ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <svg
                className="w-8 h-8 text-white opacity-75"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          ) : (
            <img
              src={`/api/media/${media?.path}`}
              alt={media?.alt || media?.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{media?.title}</p>
          <p className="text-sm text-gray-500">
            {media?.width && media?.height
              ? `${media.width}x${media.height} · `
              : ""}
            {media ? formatFileSize(media.size) : ""}
          </p>
        </div>

        {/* Expand/collapse icon */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Alt text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={editForm.alt}
              onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
              placeholder="Describe the image for accessibility"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={editForm.lat}
                onChange={(e) =>
                  setEditForm({ ...editForm, lat: e.target.value })
                }
                placeholder="-90 to 90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={editForm.lon}
                onChange={(e) =>
                  setEditForm({ ...editForm, lon: e.target.value })
                }
                placeholder="-180 to 180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date taken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Taken
            </label>
            <input
              type="date"
              value={editForm.date_taken}
              onChange={(e) =>
                setEditForm({ ...editForm, date_taken: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Read-only info */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            <p>
              <span className="font-medium">Filename:</span> {media?.filename}
            </p>
            <p>
              <span className="font-medium">Type:</span> {media?.mime_type}
            </p>
            {media?.width && media?.height && (
              <p>
                <span className="font-medium">Dimensions:</span> {media.width} x{" "}
                {media.height}
              </p>
            )}
            <p>
              <span className="font-medium">Size:</span>{" "}
              {media ? formatFileSize(media.size) : ""}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Remove Image
            </button>
            <label className="cursor-pointer ml-auto">
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Replace
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
