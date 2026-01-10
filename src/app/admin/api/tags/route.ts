import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireEditor } from "@/lib/api-auth";

// GET /api/tags - List all tags
export async function GET() {
  const auth = await requireEditor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { results } = await db
      .prepare("SELECT * FROM tags ORDER BY name ASC")
      .all();

    return NextResponse.json({
      success: true,
      data: results || [],
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

interface CreateTagBody {
  name: string;
  slug: string;
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  const auth = await requireEditor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const body = (await request.json()) as CreateTagBody;
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const result = await db
      .prepare("INSERT INTO tags (name, slug) VALUES (?, ?)")
      .bind(name, slug)
      .run();

    const tag = await db
      .prepare("SELECT * FROM tags WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ success: true, data: tag }, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Tag with this name or slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] handled in [id]/route.ts
