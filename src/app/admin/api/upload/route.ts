import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { extractExif, generateTitleFromFilename } from "@/lib/exif";
import { getDB } from "@/lib/db";
import { requireAuthor, requireEditor } from "@/lib/api-auth";
import type { Media } from "@/types/media";

function getR2Bucket(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.MEDIA;
}

// Generate dated path: images/2026/01/filename.jpg
function generateImagePath(filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Sanitize filename: remove special chars, replace spaces with dashes
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const ext = sanitized.split(".").pop() || "jpg";
  const name = sanitized.replace(/\.[^.]+$/, "");

  return `images/${year}/${month}/${name}-${timestamp}.${ext}`;
}

// Determine media type from MIME type
function getMediaType(mimeType: string): "image" | "video" {
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return "image";
}

// POST /api/upload - Upload an image to R2 and create media record
export async function POST(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const bucket = getR2Bucket();
    const db = getDB();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for images, 100MB for videos)
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${isVideo ? "100MB" : "10MB"}`,
        },
        { status: 400 }
      );
    }

    const objectKey = generateImagePath(file.name);
    const arrayBuffer = await file.arrayBuffer();

    // Extract EXIF metadata (for images)
    const exifData = !isVideo ? extractExif(arrayBuffer, file.type) : {};

    // Upload to R2
    await bucket.put(objectKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate title from filename
    const title = generateTitleFromFilename(file.name);

    // Create media record in database with author_id
    const mediaType = getMediaType(file.type);
    const result = await db
      .prepare(
        `INSERT INTO media (title, filename, path, mime_type, size, width, height, lat, lon, date_taken, type, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        title,
        file.name,
        objectKey,
        file.type,
        file.size,
        exifData.width || null,
        exifData.height || null,
        exifData.lat || null,
        exifData.lon || null,
        exifData.dateTaken || null,
        mediaType,
        auth.user.id
      )
      .run();

    // Fetch the created media record
    const media = await db
      .prepare("SELECT * FROM media WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first<Media>();

    return NextResponse.json(
      {
        success: true,
        data: media,
        // Legacy fields for backward compatibility
        key: objectKey,
        url: `/api/media/${objectKey}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload?key=images/2026/01/file.jpg - Delete an image from R2
// Note: Prefer using DELETE /api/media/[id] for proper cleanup
// Requires editor role since this bypasses ownership checks
export async function DELETE(request: NextRequest) {
  const auth = await requireEditor();
  if (!auth.authorized) return auth.response;

  try {
    const bucket = getR2Bucket();
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "No key provided" },
        { status: 400 }
      );
    }

    // Delete from R2
    await bucket.delete(key);

    // Also delete the media record if it exists
    await db.prepare("DELETE FROM media WHERE path = ?").bind(key).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
