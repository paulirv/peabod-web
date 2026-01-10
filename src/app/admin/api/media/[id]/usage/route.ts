import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor } from "@/lib/api-auth";
import type { MediaUsageDetails } from "@/types/media";

interface ContentItem {
  id: number;
  title: string;
  slug: string;
}

// GET /api/media/[id]/usage - Get usage details for a media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;
    const mediaId = parseInt(id);

    // Get articles using this media
    const { results: articles } = await db
      .prepare("SELECT id, title, slug FROM articles WHERE media_id = ?")
      .bind(mediaId)
      .all();

    // Get pages using this media
    const { results: pages } = await db
      .prepare("SELECT id, title, slug FROM pages WHERE media_id = ?")
      .bind(mediaId)
      .all();

    const usage: MediaUsageDetails = {
      articles: (articles || []) as unknown as ContentItem[],
      pages: (pages || []) as unknown as ContentItem[],
    };

    return NextResponse.json({ success: true, data: usage });
  } catch (error) {
    console.error("Error fetching media usage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch media usage" },
      { status: 500 }
    );
  }
}
