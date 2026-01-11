// Media types for Digital Asset Management

// Video processing status for Cloudflare Stream
export type StreamStatus = "uploading" | "processing" | "ready" | "error";

export interface Media {
  id: number;
  title: string;
  alt: string | null;
  filename: string;
  path: string;
  mime_type: string;
  size: number;
  width: number | null;
  height: number | null;
  lat: number | null;
  lon: number | null;
  date_taken: string | null;
  type: "image" | "video";
  // Cloudflare Stream fields (for videos)
  stream_uid: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  stream_status: StreamStatus | null;
  stream_error: string | null;
  stream_meta: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaCreateInput {
  title: string;
  alt?: string;
  filename: string;
  path: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  lat?: number;
  lon?: number;
  date_taken?: string;
  type: "image" | "video";
  // Stream fields for video
  stream_uid?: string;
  stream_status?: StreamStatus;
}

export interface MediaUpdateInput {
  title?: string;
  alt?: string;
  lat?: number | null;
  lon?: number | null;
  date_taken?: string | null;
  tag_ids?: number[];
}

// Media with additional computed fields for display
export interface MediaWithUrl extends Media {
  url: string;
}

// Media with usage counts from API
export interface MediaWithUsage extends Media {
  article_count: number;
  page_count: number;
}

// Usage details for a media item
export interface MediaUsageDetails {
  articles: Array<{
    id: number;
    title: string;
    slug: string;
  }>;
  pages: Array<{
    id: number;
    title: string;
    slug: string;
  }>;
}
