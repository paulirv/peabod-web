"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import * as tus from "tus-js-client";
import type { Media } from "@/types/media";

interface VideoUploaderProps {
  onUploadComplete: (media: Media) => void;
  onCancel?: () => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "error";

interface StatusResponse {
  success: boolean;
  data?: Media;
  error?: string;
}

interface UploadUrlResponse {
  success: boolean;
  data?: {
    uploadURL: string;
    uid: string;
    mediaId: number;
  };
  error?: string;
}

export default function VideoUploader({
  onUploadComplete,
  onCancel,
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [streamUid, setStreamUid] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  // Poll for processing status
  useEffect(() => {
    if (status === "processing" && streamUid) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/admin/api/video/${streamUid}/status`);
          const data = (await res.json()) as StatusResponse;

          if (data.success && data.data) {
            if (data.data.stream_status === "ready") {
              setStatus("ready");
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
              onUploadComplete(data.data);
            } else if (data.data.stream_status === "error") {
              setStatus("error");
              setError(data.data.stream_error || "Processing failed");
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
            }
          }
        } catch {
          // Continue polling on network errors
        }
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [status, streamUid, onUploadComplete]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        if (!selectedFile.type.startsWith("video/")) {
          setError("Please select a video file");
          return;
        }
        setFile(selectedFile);
        setError(null);
      }
    },
    []
  );

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setProgress(0);

    try {
      // Get upload URL from our API
      const urlRes = await fetch("/admin/api/video/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          title: file.name.replace(/\.[^.]+$/, ""),
        }),
      });

      const urlData = (await urlRes.json()) as UploadUrlResponse;
      if (!urlData.success || !urlData.data) {
        throw new Error(urlData.error || "Failed to get upload URL");
      }

      const { uploadURL, uid } = urlData.data;
      setStreamUid(uid);

      // Upload via TUS
      const upload = new tus.Upload(file, {
        endpoint: uploadURL,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 50 * 1024 * 1024, // 50MB chunks
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(percentage);
        },
        onSuccess: () => {
          setStatus("processing");
          setProgress(100);
        },
        onError: (err) => {
          setStatus("error");
          setError(err.message || "Upload failed");
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setFile(null);
    setStatus("idle");
    setError(null);
    setProgress(0);
    onCancel?.();
  };

  const handleReset = () => {
    setStatus("idle");
    setFile(null);
    setError(null);
    setProgress(0);
    setStreamUid(null);
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-6">
      {status === "idle" && !file && (
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-600">Select a video to upload</p>
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
              Choose Video
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {file && status === "idle" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
            >
              Upload
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
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
            <span className="text-sm text-gray-600">
              {status === "uploading"
                ? `Uploading... ${progress}%`
                : "Processing video..."}
            </span>
          </div>
          {status === "uploading" && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {status === "processing" && (
            <p className="text-xs text-gray-500">
              Cloudflare is transcoding your video. This may take a few minutes.
            </p>
          )}
          <button
            onClick={handleCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "ready" && (
        <div className="text-center">
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
          <p className="text-green-600 font-medium">
            Video uploaded successfully!
          </p>
        </div>
      )}
    </div>
  );
}
