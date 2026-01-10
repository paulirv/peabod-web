import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor } from "@/lib/api-auth";

// GET /api/pages - List all pages
export async function GET(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    let query = "SELECT * FROM pages";
    const params: (string | number)[] = [];

    if (published !== null) {
      query += " WHERE published = ?";
      params.push(published === "true" ? 1 : 0);
    }

    query += " ORDER BY title ASC";

    const { results } = await db.prepare(query).bind(...params).all();

    return NextResponse.json({
      success: true,
      data: results || [],
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

interface CreatePageBody {
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  published?: boolean;
}

// POST /api/pages - Create new page
export async function POST(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const body = (await request.json()) as CreatePageBody;
    const { slug, title, body: content, author, authored_on, published } = body;

    if (!slug || !title || !content || !author || !authored_on) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db
      .prepare(
        `INSERT INTO pages (slug, title, body, author, authored_on, published, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(slug, title, content, author, authored_on, published ? 1 : 0, auth.user.id)
      .run();

    const page = await db
      .prepare("SELECT * FROM pages WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first();

    return NextResponse.json({ success: true, data: page }, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Page with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create page" },
      { status: 500 }
    );
  }
}
