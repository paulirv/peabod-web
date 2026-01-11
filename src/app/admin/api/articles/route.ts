import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor } from "@/lib/api-auth";

// GET /api/articles - List all articles with media data
export async function GET(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Query with LEFT JOIN to include media data
    let query = `
      SELECT a.*,
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
      FROM articles a
      LEFT JOIN media m ON a.media_id = m.id
    `;
    const params: (string | number | boolean)[] = [];

    if (published !== null) {
      query += " WHERE a.published = ?";
      params.push(published === "true" ? 1 : 0);
    }

    query += " ORDER BY a.authored_on DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const { results } = await db.prepare(query).bind(...params).all();

    // Get tags for each article and format media data
    const articlesWithTagsAndMedia = await Promise.all(
      (results || []).map(async (article) => {
        const art = article as Record<string, unknown>;
        const { results: tags } = await db
          .prepare(
            `SELECT t.* FROM tags t
             JOIN article_tags at ON t.id = at.tag_id
             WHERE at.article_id = ?`
          )
          .bind(art.id as number)
          .all();

        // Build media object if media_id exists
        const media = art.media_id
          ? {
              id: art.media_id_resolved,
              path: art.media_path,
              alt: art.media_alt,
              title: art.media_title,
              width: art.media_width,
              height: art.media_height,
              type: art.media_type,
              stream_uid: art.media_stream_uid,
              duration: art.media_duration,
              thumbnail_url: art.media_thumbnail_url,
              stream_status: art.media_stream_status,
            }
          : null;

        // Remove the joined media fields from article object
        const {
          media_id_resolved: _mid, media_path: _mp, media_alt: _ma, media_title: _mt,
          media_width: _mw, media_height: _mh, media_type: _mtype, media_stream_uid: _msu,
          media_duration: _md, media_thumbnail_url: _mtu, media_stream_status: _mss,
          ...articleData
        } = art;
        void _mid; void _mp; void _ma; void _mt; void _mw; void _mh;
        void _mtype; void _msu; void _md; void _mtu; void _mss;

        return { ...articleData, tags: tags || [], media };
      })
    );

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM articles";
    if (published !== null) {
      countQuery += " WHERE published = ?";
    }
    const countResult = await db
      .prepare(countQuery)
      .bind(...(published !== null ? [published === "true" ? 1 : 0] : []))
      .first<{ total: number }>();

    return NextResponse.json({
      success: true,
      data: {
        items: articlesWithTagsAndMedia,
        total: countResult?.total || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

interface CreateArticleBody {
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  image?: string;      // DEPRECATED: Use media_id instead
  media_id?: number;   // Reference to media table
  published?: boolean;
  tag_ids?: number[];
}

// Sanitize slug: remove leading/trailing slashes and spaces
function sanitizeSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const body = (await request.json()) as CreateArticleBody;
    const { slug: rawSlug, title, body: content, author, authored_on, image, media_id, published, tag_ids } = body;

    if (!rawSlug || !title || !content || !author || !authored_on) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = sanitizeSlug(rawSlug);

    const result = await db
      .prepare(
        `INSERT INTO articles (slug, title, body, author, authored_on, image, media_id, published, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        slug,
        title,
        content,
        author,
        authored_on,
        image || null,           // Keep for backward compatibility
        media_id || null,        // New media reference
        published ? 1 : 0,
        auth.user.id             // Set author_id to current user
      )
      .run();

    const articleId = result.meta.last_row_id;

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await db
          .prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)")
          .bind(articleId, tagId)
          .run();
      }
    }

    const article = await db
      .prepare("SELECT * FROM articles WHERE id = ?")
      .bind(articleId)
      .first();

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    if (error instanceof Error && error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { success: false, error: "Article with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create article" },
      { status: 500 }
    );
  }
}
