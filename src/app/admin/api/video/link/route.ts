import { NextRequest, NextResponse } from "next/server";
import { requireAuthor } from "@/lib/api-auth";
import { getDB } from "@/lib/db";
import { getVideoDetails, getThumbnailUrl } from "@/lib/stream";
import type { Media } from "@/types/media";

/**
 * POST /admin/api/video/link
 * Link an existing Cloudflare Stream video by UID
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json()) as { uid?: string; title?: string };
    const { uid, title } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Stream video UID is required" },
        { status: 400 }
      );
    }

    const db = getDB();

    // Check if this video is already linked
    const existing = await db
      .prepare("SELECT id FROM media WHERE stream_uid = ?")
      .bind(uid)
      .first<{ id: number }>();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This video is already in the media library" },
        { status: 400 }
      );
    }

    // Fetch video details from Stream API
    const details = await getVideoDetails(uid);

    if (!details) {
      return NextResponse.json(
        { success: false, error: "Video not found in Cloudflare Stream" },
        { status: 404 }
      );
    }

    // Check if the video is ready
    if (details.status.state !== "ready") {
      return NextResponse.json(
        {
          success: false,
          error: `Video is not ready yet. Current status: ${details.status.state}`,
        },
        { status: 400 }
      );
    }

    // Generate path and title
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const path = `videos/${year}/${month}/${uid}`;
    const videoTitle =
      title ||
      (details.meta?.name as string) ||
      `Video ${uid.substring(0, 8)}`;

    // Create media record
    const result = await db
      .prepare(
        `INSERT INTO media (
          title, filename, path, mime_type, size, width, height,
          type, stream_uid, duration, thumbnail_url, stream_status, stream_meta, author_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        videoTitle,
        `${uid}.mp4`, // Virtual filename
        path,
        "video/mp4",
        0, // Size not available from Stream API
        details.input?.width || null,
        details.input?.height || null,
        "video",
        uid,
        details.duration || null,
        getThumbnailUrl(uid),
        "ready",
        JSON.stringify(details),
        auth.user.id
      )
      .run();

    // Fetch the created record
    const media = await db
      .prepare("SELECT * FROM media WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first<Media>();

    return NextResponse.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error("Error linking video:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to link video",
      },
      { status: 500 }
    );
  }
}
