"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveImageContainer } from "@/components/ResponsiveImage";
import VideoUploader from "@/components/admin/VideoUploader";
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

type UploadMode = "none" | "library" | "image" | "video";

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
  const [uploadMode, setUploadMode] = useState<UploadMode>("none");

  // Library picker state
  const [libraryMedia, setLibraryMedia] = useState<Media[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryType, setLibraryType] = useState<"all" | "image" | "video">("all");

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

  // Fetch library when library mode is opened or type changes
  useEffect(() => {
    if (uploadMode === "library") {
      const fetchLib = async () => {
        setLibraryLoading(true);
        try {
          const params = new URLSearchParams();
          if (libraryType !== "all") {
            params.set("type", libraryType);
          }
          const res = await fetch(`/admin/api/media?${params.toString()}`);
          const data = (await res.json()) as { success: boolean; data?: { items: Media[] } };
          if (data.success && data.data?.items) {
            setLibraryMedia(data.data.items);
          }
        } catch {
          // Silently fail
        } finally {
          setLibraryLoading(false);
        }
      };
      fetchLib();
    }
  }, [uploadMode, libraryType]);

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
          setUploadMode("none");
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

  const handleVideoUploadComplete = (uploadedMedia: Media) => {
    setMedia(uploadedMedia);
    onMediaChange(uploadedMedia.id);
    setEditForm({
      title: uploadedMedia.title || "",
      alt: uploadedMedia.alt || "",
      lat: uploadedMedia.lat?.toString() || "",
      lon: uploadedMedia.lon?.toString() || "",
      date_taken: uploadedMedia.date_taken
        ? uploadedMedia.date_taken.split("T")[0]
        : "",
    });
    onUploadComplete?.(uploadedMedia);
    setExpanded(true);
    setUploadMode("none");
  };

  const handleSelectFromLibrary = (selectedMedia: Media) => {
    setMedia(selectedMedia);
    onMediaChange(selectedMedia.id);
    setEditForm({
      title: selectedMedia.title || "",
      alt: selectedMedia.alt || "",
      lat: selectedMedia.lat?.toString() || "",
      lon: selectedMedia.lon?.toString() || "",
      date_taken: selectedMedia.date_taken
        ? selectedMedia.date_taken.split("T")[0]
        : "",
    });
    setUploadMode("none");
  };

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

  // Filter library by search
  const filteredLibrary = libraryMedia.filter((item) =>
    item.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
    item.filename.toLowerCase().includes(librarySearch.toLowerCase())
  );

  // No media selected - show selection options
  if (!media && !loading) {
    // Library picker mode
    if (uploadMode === "library") {
      return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Select from Library</h3>
            <button
              type="button"
              onClick={() => setUploadMode("none")}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-200 flex gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={libraryType}
              onChange={(e) => setLibraryType(e.target.value as "all" | "image" | "video")}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>

          {/* Media grid */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {libraryLoading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : filteredLibrary.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No media found</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectFromLibrary(item)}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveImageContainer
                        path={item.path}
                        alt={item.alt || item.title}
                        preset="mediaThumbnail"
                        containerClassName="w-full h-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Video upload mode
    if (uploadMode === "video") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Upload Video</span>
            <button
              type="button"
              onClick={() => setUploadMode("none")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <VideoUploader
            onUploadComplete={handleVideoUploadComplete}
            onCancel={() => setUploadMode("none")}
          />
        </div>
      );
    }

    // Image upload mode (direct file input)
    if (uploadMode === "image") {
      return (
        <div className="border border-dashed border-gray-300 rounded-lg p-6">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600">Select an image to upload</p>
              <div className="flex gap-3">
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    Choose Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setUploadMode("none")}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
        </div>
      );
    }

    // Default: show selection options
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600">No media selected</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setUploadMode("library")}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Select from Library
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("image")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("video")}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Upload Video
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 flex justify-center">
        <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
            <div className="w-full h-full flex items-center justify-center bg-gray-800 relative">
              {media.thumbnail_url ? (
                <>
                  <img src={media.thumbnail_url} alt={media.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <svg className="w-8 h-8 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          ) : (
            <ResponsiveImageContainer
              path={media?.path || ""}
              alt={media?.alt || media?.title || "Media preview"}
              preset="mediaThumbnail"
              containerClassName="w-full h-full"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{media?.title}</p>
          <p className="text-sm text-gray-500">
            {media?.type === "video" ? (
              <span className="inline-flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Video</span>
                {media?.width && media?.height && ` · ${media.width}x${media.height}`}
              </span>
            ) : (
              <>
                {media?.width && media?.height
                  ? `${media.width}x${media.height} · `
                  : ""}
                {media ? formatFileSize(media.size) : ""}
              </>
            )}
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              placeholder="Describe the media for accessibility"
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
              <span className="font-medium">ID:</span> {media?.id}
            </p>
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
              Remove Media
            </button>
            <button
              type="button"
              onClick={() => {
                handleRemove();
                setUploadMode("library");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors ml-auto"
            >
              Replace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
