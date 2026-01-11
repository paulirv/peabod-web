"use client";

import { useState } from "react";
import type { Media } from "@/types/media";

interface VideoLinkerProps {
  onLinkComplete: (media: Media) => void;
  onCancel?: () => void;
}

type LinkStatus = "idle" | "linking" | "success" | "error";

interface LinkResponse {
  success: boolean;
  data?: Media;
  error?: string;
}

export default function VideoLinker({
  onLinkComplete,
  onCancel,
}: VideoLinkerProps) {
  const [uid, setUid] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<LinkStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid.trim()) {
      setError("Please enter a Stream video ID");
      return;
    }

    setStatus("linking");
    setError(null);

    try {
      const res = await fetch("/admin/api/video/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: uid.trim(),
          title: title.trim() || undefined,
        }),
      });

      const data = (await res.json()) as LinkResponse;

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to link video");
      }

      setStatus("success");
      onLinkComplete(data.data);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to link video");
    }
  };

  const handleReset = () => {
    setUid("");
    setTitle("");
    setStatus("idle");
    setError(null);
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-6">
      {(status === "idle" || status === "error") && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="video-uid"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stream Video ID
            </label>
            <input
              type="text"
              id="video-uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Enter the video UID from Cloudflare Stream"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Find this in your Cloudflare dashboard under Stream &gt; Videos
            </p>
          </div>

          <div>
            <label
              htmlFor="video-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title (optional)
            </label>
            <input
              type="text"
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this video"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Link Video
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {status === "linking" && (
        <div className="flex items-center justify-center gap-3 py-8">
          <svg
            className="animate-spin h-5 w-5 text-purple-500"
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
          <span className="text-sm text-gray-600">Fetching video details...</span>
        </div>
      )}

      {status === "success" && (
        <div className="text-center py-4">
          <svg
            className="w-12 h-12 text-green-500 mx-auto mb-2"
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
          <p className="text-green-600 font-medium">Video linked successfully!</p>
          <button
            onClick={handleReset}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Link another video
          </button>
        </div>
      )}
    </div>
  );
}
