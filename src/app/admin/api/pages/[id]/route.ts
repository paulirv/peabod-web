import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor, requireOwnerOrEditor } from "@/lib/api-auth";

interface UpdatePageBody {
  slug?: string;
  title?: string;
  body?: string;
  author?: string;
  authored_on?: string;
  published?: boolean;
}

// GET /api/pages/[id] - Get single page
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
      ? "SELECT * FROM pages WHERE id = ?"
      : "SELECT * FROM pages WHERE slug = ?";

    const page = await db.prepare(query).bind(isNumeric ? parseInt(id) : id).first();

    if (!page) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: page });
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
    const values: (string | number)[] = [];

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
