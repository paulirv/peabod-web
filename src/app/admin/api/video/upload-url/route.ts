import { NextRequest, NextResponse } from "next/server";
import { requireAuthor } from "@/lib/api-auth";
import { getDB } from "@/lib/db";
import { createDirectUpload } from "@/lib/stream";

/**
 * Generate a title from a filename
 */
function generateTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // Remove extension
    .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * POST /admin/api/video/upload-url
 * Get a signed URL for direct upload to Cloudflare Stream
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json()) as { filename?: string; title?: string };
    const { filename, title } = body;

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Filename is required" },
        { status: 400 }
      );
    }

    // Create direct upload URL from Cloudflare Stream
    const { uploadURL, uid } = await createDirectUpload(3600, {
      name: title || filename,
      uploadedBy: auth.user.email,
    });

    // Create placeholder media record with "uploading" status
    const db = getDB();
    const generatedTitle = title || generateTitleFromFilename(filename);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const path = `videos/${year}/${month}/${uid}`;

    const result = await db
      .prepare(
        `INSERT INTO media (title, filename, path, mime_type, size, type, stream_uid, stream_status, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        generatedTitle,
        filename,
        path,
        "video/mp4", // Will be updated when processing completes
        0, // Size unknown until upload completes
        "video",
        uid,
        "uploading",
        auth.user.id
      )
      .run();

    return NextResponse.json({
      success: true,
      data: {
        uploadURL,
        uid,
        mediaId: result.meta.last_row_id,
      },
    });
  } catch (error) {
    console.error("Error creating upload URL:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create upload URL",
      },
      { status: 500 }
    );
  }
}
