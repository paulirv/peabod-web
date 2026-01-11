import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor, requireOwnerOrEditor } from "@/lib/api-auth";
import { deleteVideo as deleteStreamVideo } from "@/lib/stream";
import type { Media, MediaUpdateInput } from "@/types/media";

function getR2Bucket(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.MEDIA;
}

// GET /api/media/[id] - Get a single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;

    // Support lookup by ID or path
    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric
      ? "SELECT * FROM media WHERE id = ?"
      : "SELECT * FROM media WHERE path = ?";

    const media = await db
      .prepare(query)
      .bind(isNumeric ? parseInt(id) : id)
      .first<Media>();

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id] - Update media metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const { id } = await params;
    const body = (await request.json()) as MediaUpdateInput;

    // Check media exists
    const existing = await db
      .prepare("SELECT * FROM media WHERE id = ?")
      .bind(parseInt(id))
      .first<Media & { author_id: number | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }

    // Check ownership - admin/editor can edit any, authors only their own
    const auth = await requireOwnerOrEditor(existing.author_id);
    if (!auth.authorized) return auth.response;

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.title !== undefined) {
      updates.push("title = ?");
      values.push(body.title);
    }
    if (body.alt !== undefined) {
      updates.push("alt = ?");
      values.push(body.alt || null);
    }
    if (body.lat !== undefined) {
      updates.push("lat = ?");
      values.push(body.lat);
    }
    if (body.lon !== undefined) {
      updates.push("lon = ?");
      values.push(body.lon);
    }
    if (body.date_taken !== undefined) {
      updates.push("date_taken = ?");
      values.push(body.date_taken);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(parseInt(id));

    await db
      .prepare(`UPDATE media SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    // Fetch updated record
    const updated = await db
      .prepare("SELECT * FROM media WHERE id = ?")
      .bind(parseInt(id))
      .first<Media>();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id] - Delete media (record and R2 file)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const bucket = getR2Bucket();
    const { id } = await params;

    // Get media record
    const media = await db
      .prepare("SELECT * FROM media WHERE id = ?")
      .bind(parseInt(id))
      .first<Media & { author_id: number | null }>();

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 }
      );
    }

    // Check ownership - admin/editor can delete any, authors only their own
    const auth = await requireOwnerOrEditor(media.author_id);
    if (!auth.authorized) return auth.response;

    // Check if media is referenced by articles or pages
    const articleRef = await db
      .prepare("SELECT id FROM articles WHERE media_id = ? LIMIT 1")
      .bind(parseInt(id))
      .first();

    const pageRef = await db
      .prepare("SELECT id FROM pages WHERE media_id = ? LIMIT 1")
      .bind(parseInt(id))
      .first();

    if (articleRef || pageRef) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete media that is referenced by articles or pages",
        },
        { status: 409 }
      );
    }

    // Delete from storage (R2 for images, Stream for videos)
    if (media.stream_uid) {
      // Video stored in Cloudflare Stream
      await deleteStreamVideo(media.stream_uid);
    } else {
      // Image stored in R2
      await bucket.delete(media.path);
    }

    // Delete from database
    await db.prepare("DELETE FROM media WHERE id = ?").bind(parseInt(id)).run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
