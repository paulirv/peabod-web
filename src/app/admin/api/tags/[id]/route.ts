import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireEditor } from "@/lib/api-auth";

interface UpdateTagBody {
  name?: string;
  slug?: string;
}

// GET /api/tags/[id] - Get single tag with content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEditor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;

    const isNumeric = /^\d+$/.test(id);
    const query = isNumeric
      ? "SELECT * FROM tags WHERE id = ?"
      : "SELECT * FROM tags WHERE slug = ?";

    const tag = await db.prepare(query).bind(isNumeric ? parseInt(id) : id).first<{ id: number; name: string; slug: string }>();

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

    // Get articles with this tag
    const { results: articles } = await db
      .prepare(`
        SELECT a.id, a.slug, a.title, a.author, a.authored_on, a.published
        FROM articles a
        JOIN article_tags at ON a.id = at.article_id
        WHERE at.tag_id = ?
        ORDER BY a.authored_on DESC
      `)
      .bind(tag.id)
      .all();

    // Get pages with this tag
    const { results: pages } = await db
      .prepare(`
        SELECT p.id, p.slug, p.title, p.author, p.authored_on, p.published
        FROM pages p
        JOIN page_tags pt ON p.id = pt.page_id
        WHERE pt.tag_id = ?
        ORDER BY p.authored_on DESC
      `)
      .bind(tag.id)
      .all();

    // Get media with this tag
    const { results: media } = await db
      .prepare(`
        SELECT m.id, m.title, m.filename, m.path, m.type, m.created_at
        FROM media m
        JOIN media_tags mt ON m.id = mt.media_id
        WHERE mt.tag_id = ?
        ORDER BY m.created_at DESC
      `)
      .bind(tag.id)
      .all();

    return NextResponse.json({
      success: true,
      data: {
        ...tag,
        article_count: articles?.length || 0,
        page_count: pages?.length || 0,
        media_count: media?.length || 0,
        articles: articles || [],
        pages: pages || [],
        media: media || [],
      },
    });
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}

// PUT /api/tags/[id] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEditor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;
    const body = (await request.json()) as UpdateTagBody;

    const existing = await db
      .prepare("SELECT * FROM tags WHERE id = ?")
      .bind(parseInt(id))
      .first();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }
    if (body.slug !== undefined) {
      updates.push("slug = ?");
      values.push(body.slug);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, data: existing });
    }

    values.push(parseInt(id));

    await db
      .prepare(`UPDATE tags SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await db
      .prepare("SELECT * FROM tags WHERE id = ?")
      .bind(parseInt(id))
      .first();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating tag:", error);
    if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Tag with this name or slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEditor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;

    const existing = await db
      .prepare("SELECT * FROM tags WHERE id = ?")
      .bind(parseInt(id))
      .first();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 }
      );
    }

    await db.prepare("DELETE FROM tags WHERE id = ?").bind(parseInt(id)).run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
