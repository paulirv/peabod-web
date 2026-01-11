import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor, requireOwnerOrEditor } from "@/lib/api-auth";

interface UpdatePageBody {
  slug?: string;
  title?: string;
  body?: string;
  author?: string;
  authored_on?: string;
  media_id?: number | null;
  published?: boolean;
  tag_ids?: number[];
}

// GET /api/pages/[id] - Get single page with media data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;

    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric
      ? `SELECT p.*,
                m.id as media_id_resolved,
                m.path as media_path,
                m.alt as media_alt,
                m.title as media_title,
                m.width as media_width,
                m.height as media_height,
                m.type as media_type,
                m.stream_uid as media_stream_uid,
                m.duration as media_duration,
                m.thumbnail_url as media_thumbnail_url,
                m.stream_status as media_stream_status
         FROM pages p
         LEFT JOIN media m ON p.media_id = m.id
         WHERE p.id = ?`
      : `SELECT p.*,
                m.id as media_id_resolved,
                m.path as media_path,
                m.alt as media_alt,
                m.title as media_title,
                m.width as media_width,
                m.height as media_height,
                m.type as media_type,
                m.stream_uid as media_stream_uid,
                m.duration as media_duration,
                m.thumbnail_url as media_thumbnail_url,
                m.stream_status as media_stream_status
         FROM pages p
         LEFT JOIN media m ON p.media_id = m.id
         WHERE p.slug = ?`;

    const result = await db.prepare(query).bind(isNumeric ? parseInt(id) : id).first();

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    const p = result as Record<string, unknown>;

    // Build media object if media_id exists
    const media = p.media_id
      ? {
          id: p.media_id_resolved,
          path: p.media_path,
          alt: p.media_alt,
          title: p.media_title,
          width: p.media_width,
          height: p.media_height,
          type: p.media_type,
          stream_uid: p.media_stream_uid,
          duration: p.media_duration,
          thumbnail_url: p.media_thumbnail_url,
          stream_status: p.media_stream_status,
        }
      : null;

    // Get tags for this page
    const { results: tags } = await db
      .prepare(
        `SELECT t.* FROM tags t
         JOIN page_tags pt ON t.id = pt.tag_id
         WHERE pt.page_id = ?`
      )
      .bind(p.id)
      .all();

    // Remove the joined media fields from page object
    const {
      media_id_resolved: _mid, media_path: _mp, media_alt: _ma, media_title: _mt,
      media_width: _mw, media_height: _mh, media_type: _mtype, media_stream_uid: _msu,
      media_duration: _md, media_thumbnail_url: _mtu, media_stream_status: _mss,
      ...pageData
    } = p;
    void _mid; void _mp; void _ma; void _mt; void _mw; void _mh;
    void _mtype; void _msu; void _md; void _mtu; void _mss;

    return NextResponse.json({ success: true, data: { ...pageData, tags: tags || [], media } });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

// PUT /api/pages/[id] - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const { id } = await params;
    const body = (await request.json()) as UpdatePageBody;

    const existing = await db
      .prepare("SELECT * FROM pages WHERE id = ?")
      .bind(parseInt(id))
      .first<{ author_id: number | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
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
      values.push(body.slug);
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
    if (body.media_id !== undefined) {
      updates.push("media_id = ?");
      values.push(body.media_id);
    }
    if (body.published !== undefined) {
      updates.push("published = ?");
      values.push(body.published ? 1 : 0);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(parseInt(id));

    await db
      .prepare(`UPDATE pages SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    // Update tags if provided
    if (body.tag_ids !== undefined) {
      await db
        .prepare("DELETE FROM page_tags WHERE page_id = ?")
        .bind(parseInt(id))
        .run();

      for (const tagId of body.tag_ids) {
        await db
          .prepare("INSERT INTO page_tags (page_id, tag_id) VALUES (?, ?)")
          .bind(parseInt(id), tagId)
          .run();
      }
    }

    const updated = await db
      .prepare("SELECT * FROM pages WHERE id = ?")
      .bind(parseInt(id))
      .first();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating page:", error);
    if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Page with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update page" },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[id] - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const { id } = await params;

    const existing = await db
      .prepare("SELECT * FROM pages WHERE id = ?")
      .bind(parseInt(id))
      .first<{ author_id: number | null }>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    // Check ownership - admin/editor can delete any, authors only their own
    const auth = await requireOwnerOrEditor(existing.author_id);
    if (!auth.authorized) return auth.response;

    await db.prepare("DELETE FROM pages WHERE id = ?").bind(parseInt(id)).run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
