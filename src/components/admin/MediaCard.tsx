"use client";

import type { Media } from "@/types/media";

interface MediaCardProps {
  media: Media;
  selected?: boolean;
  onSelect?: (media: Media) => void;
  onEdit?: (media: Media) => void;
  onDelete?: (media: Media) => void;
  inUse?: boolean;
  onShowUsage?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaCard({
  media,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  inUse = false,
  onShowUsage,
}: MediaCardProps) {
  const isVideo = media.type === "video";

  return (
    <div
      className={`relative group rounded-lg border overflow-hidden transition-all cursor-pointer ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={() => onSelect?.(media)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {isVideo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <svg
              className="w-12 h-12 text-white opacity-75"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : (
          <img
            src={`/api/media/${media.path}`}
            alt={media.alt || media.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${
              isVideo
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {isVideo ? "Video" : "Image"}
          </span>
        </div>

        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}

        {/* In Use badge */}
        {inUse && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowUsage?.();
              }}
              className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
              title="Click to see where this media is used"
            >
              In Use
            </button>
          </div>
        )}

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(media);
              }}
              className="px-3 py-1.5 bg-white text-gray-800 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(media);
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          )}
          {inUse && onShowUsage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowUsage();
              }}
              className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Usage
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate" title={media.title}>
          {media.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {media.width && media.height && (
            <span>
              {media.width}x{media.height}
            </span>
          )}
          <span>{formatFileSize(media.size)}</span>
        </div>
      </div>
    </div>
  );
}
