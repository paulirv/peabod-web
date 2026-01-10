import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { generateTitleFromFilename } from "@/lib/exif";

function getR2Bucket(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.MEDIA;
}

interface ArticleWithImage {
  id: number;
  title: string;
  image: string;
  media_id: number | null;
}

// POST /api/migrate/images - Migrate existing article images to media records
export async function POST() {
  try {
    const bucket = getR2Bucket();
    const db = getDB();

    // Find articles with image but no media_id
    const { results } = await db
      .prepare(
        "SELECT id, title, image, media_id FROM articles WHERE image IS NOT NULL AND image != '' AND media_id IS NULL"
      )
      .all();

    const articles = (results || []) as unknown as ArticleWithImage[];

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No articles to migrate",
        migrated: 0,
      });
    }

    const migrated: { articleId: number; mediaId: number; path: string }[] = [];
    const errors: { articleId: number; path: string; error: string }[] = [];

    for (const article of articles) {
      try {
        // Get R2 object metadata
        const object = await bucket.head(article.image);

        if (!object) {
          errors.push({
            articleId: article.id,
            path: article.image,
            error: "Object not found in R2",
          });
          continue;
        }

        // Extract filename from path
        const filename = article.image.split("/").pop() || article.image;
        const title = generateTitleFromFilename(filename);

        // Determine media type from content type
        const mimeType = object.httpMetadata?.contentType || "image/jpeg";
        const mediaType = mimeType.startsWith("video/") ? "video" : "image";

        // Check if media record already exists for this path
        const existingMedia = await db
          .prepare("SELECT id FROM media WHERE path = ?")
          .bind(article.image)
          .first<{ id: number }>();

        let mediaId: number;

        if (existingMedia) {
          // Use existing media record
          mediaId = existingMedia.id;
        } else {
          // Create media record
          const result = await db
            .prepare(
              `INSERT INTO media (title, filename, path, mime_type, size, type)
               VALUES (?, ?, ?, ?, ?, ?)`
            )
            .bind(
              title,
              filename,
              article.image,
              mimeType,
              object.size,
              mediaType
            )
            .run();

          mediaId = result.meta.last_row_id as number;
        }

        // Update article with media_id
        await db
          .prepare("UPDATE articles SET media_id = ? WHERE id = ?")
          .bind(mediaId, article.id)
          .run();

        migrated.push({
          articleId: article.id,
          mediaId,
          path: article.image,
        });
      } catch (err) {
        errors.push({
          articleId: article.id,
          path: article.image,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete`,
      total: articles.length,
      migrated: migrated.length,
      errors: errors.length,
      details: { migrated, errors },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}

// GET /api/migrate/images - Check migration status
export async function GET() {
  try {
    const db = getDB();

    // Count articles needing migration
    const needsMigration = await db
      .prepare(
        "SELECT COUNT(*) as count FROM articles WHERE image IS NOT NULL AND image != '' AND media_id IS NULL"
      )
      .first<{ count: number }>();

    // Count already migrated
    const alreadyMigrated = await db
      .prepare(
        "SELECT COUNT(*) as count FROM articles WHERE media_id IS NOT NULL"
      )
      .first<{ count: number }>();

    // Count total media records
    const totalMedia = await db
      .prepare("SELECT COUNT(*) as count FROM media")
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      status: {
        articlesPendingMigration: needsMigration?.count || 0,
        articlesWithMedia: alreadyMigrated?.count || 0,
        totalMediaRecords: totalMedia?.count || 0,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check migration status",
      },
      { status: 500 }
    );
  }
}
