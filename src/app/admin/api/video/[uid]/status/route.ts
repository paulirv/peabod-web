import { NextRequest, NextResponse } from "next/server";
import { requireAuthor } from "@/lib/api-auth";
import { getDB } from "@/lib/db";
import { getVideoDetails, getThumbnailUrl } from "@/lib/stream";
import type { Media, StreamStatus } from "@/types/media";

/**
 * GET /admin/api/video/[uid]/status
 * Check video processing status and update database if needed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const { uid } = await params;
    const db = getDB();

    // Get current media record
    const media = await db
      .prepare("SELECT * FROM media WHERE stream_uid = ?")
      .bind(uid)
      .first<Media>();

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // If already ready or error, return current status
    if (media.stream_status === "ready" || media.stream_status === "error") {
      return NextResponse.json({ success: true, data: media });
    }

    // Fetch current status from Stream API
    const details = await getVideoDetails(uid);

    if (!details) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch video status from Stream" },
        { status: 500 }
      );
    }

    // Map Stream status to our status
    let newStatus: StreamStatus;
    let errorMessage: string | null = null;

    switch (details.status.state) {
      case "queued":
      case "inprogress":
        newStatus = "processing";
        break;
      case "ready":
        newStatus = "ready";
        break;
      case "error":
        newStatus = "error";
        errorMessage = details.status.errorReasonText || "Processing failed";
        break;
      default:
        newStatus = "processing";
    }

    // Update database if status changed
    if (newStatus !== media.stream_status) {
      const thumbnailUrl = newStatus === "ready" ? getThumbnailUrl(uid) : null;

      await db
        .prepare(
          `UPDATE media SET
            stream_status = ?,
            stream_error = ?,
            duration = ?,
            width = ?,
            height = ?,
            thumbnail_url = ?,
            stream_meta = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE stream_uid = ?`
        )
        .bind(
          newStatus,
          errorMessage,
          details.duration || null,
          details.input?.width || null,
          details.input?.height || null,
          thumbnailUrl,
          JSON.stringify(details),
          uid
        )
        .run();
    }

    // Fetch updated record
    const updated = await db
      .prepare("SELECT * FROM media WHERE stream_uid = ?")
      .bind(uid)
      .first<Media>();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error checking video status:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check video status",
      },
      { status: 500 }
    );
  }
}
