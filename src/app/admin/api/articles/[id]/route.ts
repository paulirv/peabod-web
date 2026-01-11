import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor, requireOwnerOrEditor } from "@/lib/api-auth";

// Sanitize slug: remove leading/trailing slashes and spaces
function sanitizeSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

interface UpdateArticleBody {
  slug?: string;
  title?: string;
  body?: string;
  author?: string;
  authored_on?: string;
  image?: string | null;       // DEPRECATED: Use media_id instead
  media_id?: number | null;    // Reference to media table
  published?: boolean;
  tag_ids?: number[];
}

// GET /api/articles/[id] - Get single article with media data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;

    // Check if id is a number (id) or string (slug)
    const isNumeric = /^\d+$/.test(id);

    // Query with LEFT JOIN to include media data
    const query = isNumeric
      ? `SELECT a.*,
                m.id as media_id_resolved,
                m.path as media_path,
                m.alt as media_alt,
                m.title as media_title,
                m.width as media_width,
                m.height as media_height,
                m.filename as media_filename,
                m.mime_type as media_mime_type,
                m.size as media_size,
                m.lat as media_lat,
                m.lon as media_lon,
                m.date_taken as media_date_taken,
                m.type as media_type,
                m.stream_uid as media_stream_uid,
                m.duration as media_duration,
                m.thumbnail_url as media_thumbnail_url,
                m.stream_status as media_stream_status
         FROM articles a
         LEFT JOIN media m ON a.media_id = m.id
         WHERE a.id = ?`
      : `SELECT a.*,
                m.id as media_id_resolved,
                m.path as media_path,
                m.alt as media_alt,
                m.title as media_title,
                m.width as media_width,
                m.height as media_height,
                m.filename as media_filename,
                m.mime_type as media_mime_type,
                m.size as media_size,
                m.lat as media_lat,
                m.lon as media_lon,
                m.date_taken as media_date_taken,
                m.type as media_type,
                m.stream_uid as media_stream_uid,
                m.duration as media_duration,
                m.thumbnail_url as media_thumbnail_url,
                m.stream_status as media_stream_status
         FROM articles a
         LEFT JOIN media m ON a.media_id = m.id
         WHERE a.slug = ?`;

    const result = await db.prepare(query).bind(isNumeric ? parseInt(id) : id).first() as Record<string, unknown> | null;

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // Get tags
    const { results: tags } = await db
      .prepare(
        `SELECT t.* FROM tags t
         JOIN article_tags at ON t.id = at.tag_id
         WHERE at.article_id = ?`
      )
      .bind(result.id)
      .all();

    // Build media object if media_id exists
    const media = result.media_id
      ? {
          id: result.media_id_resolved,
          path: result.media_path,
          alt: result.media_alt,
          title: result.media_title,
          width: result.media_width,
          height: result.media_height,
          filename: result.media_filename,
          mime_type: result.media_mime_type,
          size: result.media_size,
          lat: result.media_lat,
          lon: result.media_lon,
          date_taken: result.media_date_taken,
          type: result.media_type,
          stream_uid: result.media_stream_uid,
          duration: result.media_duration,
          thumbnail_url: result.media_thumbnail_url,
          stream_status: result.media_stream_status,
        }
      : null;

    // Remove the joined media fields from article object
    const {
      media_id_resolved: _1, media_path: _2, media_alt: _3, media_title: _4, media_width: _5,
      media_height: _6, media_filename: _7, media_mime_type: _8, media_size: _9, media_lat: _10,
      media_lon: _11, media_date_taken: _12, media_type: _13, media_stream_uid: _14,
      media_duration: _15, media_thumbnail_url: _16, media_stream_status: _17,
      ...articleData
    } = result;
    void [_1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17];

    return NextResponse.json({
      success: true,
      data: { ...articleData, tags: tags || [], media },
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const { id } = await params;
    const body = (await request.json()) as UpdateArticleBody;

    const existing = await db
      .prepare("SELECT * FROM articles WHERE id = ?")
      .bind(parseInt(id))
      .first<{ author_id: number | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // Check ownership - admin/editor can edit any, authors only their own
    const auth = await requireOwnerOrEditor(existing.author_id);
    if (!auth.authorized) return auth.response;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.slug !== undefined) {
      updates.push("slug = ?");
      values.push(sanitizeSlug(body.slug));
    }
    if (body.title !== undefined) {
      updates.push("title = ?");
      values.push(body.title);
    }
    if (body.body !== undefined) {
      updates.push("body = ?");
      values.push(body.body);
    }
    if (body.author !== undefined) {
      updates.push("author = ?");
      values.push(body.author);
    }
    if (body.authored_on !== undefined) {
      updates.push("authored_on = ?");
      values.push(body.authored_on);
    }
    if (body.image !== undefined) {
      updates.push("image = ?");
      values.push(body.image || "");
    }
    if (body.media_id !== undefined) {
      updates.push("media_id = ?");
      values.push(body.media_id as number | null);
    }
    if (body.published !== undefined) {
      updates.push("published = ?");
      values.push(body.published ? 1 : 0);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(parseInt(id));

    await db
      .prepare(`UPDATE articles SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    // Update tags if provided
    if (body.tag_ids !== undefined) {
      await db
        .prepare("DELETE FROM article_tags WHERE article_id = ?")
        .bind(parseInt(id))
        .run();

      for (const tagId of body.tag_ids) {
        await db
          .prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)")
          .bind(parseInt(id), tagId)
          .run();
      }
    }

    const updated = await db
      .prepare("SELECT * FROM articles WHERE id = ?")
      .bind(parseInt(id))
      .first();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating article:", error);
    if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Article with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const { id } = await params;

    const existing = await db
      .prepare("SELECT * FROM articles WHERE id = ?")
      .bind(parseInt(id))
      .first<{ author_id: number | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // Check ownership - admin/editor can delete any, authors only their own
    const auth = await requireOwnerOrEditor(existing.author_id);
    if (!auth.authorized) return auth.response;

    await db
      .prepare("DELETE FROM articles WHERE id = ?")
      .bind(parseInt(id))
      .run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
