import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor } from "@/lib/api-auth";
import type { Media } from "@/types/media";

// GET /api/media - List all media with pagination and filtering
export async function GET(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);

    // Query parameters
    const type = searchParams.get("type"); // 'image' or 'video'
    const search = searchParams.get("search"); // Search in title/filename
    const sort = searchParams.get("sort") || "desc"; // 'asc' or 'desc'
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query with usage counts
    let query = `
      SELECT m.*,
             (SELECT COUNT(*) FROM articles WHERE media_id = m.id) as article_count,
             (SELECT COUNT(*) FROM pages WHERE media_id = m.id) as page_count
      FROM media m`;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (type) {
      conditions.push("m.type = ?");
      params.push(type);
    }

    if (search) {
      conditions.push("(m.title LIKE ? OR m.filename LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const sortOrder = sort === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY m.created_at ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM media";
    const countParams: (string | number)[] = [];

    if (type || search) {
      const countConditions: string[] = [];
      if (type) {
        countConditions.push("type = ?");
        countParams.push(type);
      }
      if (search) {
        countConditions.push("(title LIKE ? OR filename LIKE ?)");
        countParams.push(`%${search}%`, `%${search}%`);
      }
      countQuery += " WHERE " + countConditions.join(" AND ");
    }

    const countResult = await db
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>();

    return NextResponse.json({
      success: true,
      data: {
        items: (results || []) as unknown as Media[],
        total: countResult?.total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
