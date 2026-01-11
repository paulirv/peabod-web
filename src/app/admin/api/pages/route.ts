import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor } from "@/lib/api-auth";

// GET /api/pages - List all pages with media data
export async function GET(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    // Query with LEFT JOIN to include media data
    let query = `
      SELECT p.*,
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
    `;
    const params: (string | number)[] = [];

    if (published !== null) {
      query += " WHERE p.published = ?";
      params.push(published === "true" ? 1 : 0);
    }

    query += " ORDER BY p.title ASC";

    const { results } = await db.prepare(query).bind(...params).all();

    // Format media data
    const pagesWithMedia = (results || []).map((page) => {
      const p = page as Record<string, unknown>;

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

      // Remove the joined media fields from page object
      const {
        media_id_resolved: _mid, media_path: _mp, media_alt: _ma, media_title: _mt,
        media_width: _mw, media_height: _mh, media_type: _mtype, media_stream_uid: _msu,
        media_duration: _md, media_thumbnail_url: _mtu, media_stream_status: _mss,
        ...pageData
      } = p;
      void _mid; void _mp; void _ma; void _mt; void _mw; void _mh;
      void _mtype; void _msu; void _md; void _mtu; void _mss;

      return { ...pageData, media };
    });

    return NextResponse.json({
      success: true,
      data: pagesWithMedia,
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
  media_id?: number;
  published?: boolean;
}

// POST /api/pages - Create new page
export async function POST(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const body = (await request.json()) as CreatePageBody;
    const { slug, title, body: content, author, authored_on, media_id, published } = body;

    if (!slug || !title || !content || !author || !authored_on) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db
      .prepare(
        `INSERT INTO pages (slug, title, body, author, authored_on, media_id, published, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(slug, title, content, author, authored_on, media_id || null, published ? 1 : 0, auth.user.id)
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
