import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export interface SiteSettings {
  id: number;
  // Core site info
  site_url: string | null;
  site_name: string | null;
  site_description: string | null;
  // SEO/Meta
  meta_title_suffix: string | null;
  default_og_image_id: number | null;
  default_og_image_path?: string | null;
  // Display
  site_icon_id: number | null;
  site_icon_path?: string | null;
  logo_media_id: number | null;
  logo_path?: string | null;
  logo_text_display: string | null;  // 'none', 'after', 'below'
  copyright_text: string | null;
  // Content settings
  posts_per_page: number;
  // Contact info
  contact_email: string | null;
  // Social media
  social_twitter: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_github: string | null;
  social_substack: string | null;
  // Timestamps
  updated_at: string;
}

// GET /admin/api/settings - Get site settings
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();

    // Get settings with joined media paths
    const settings = await db
      .prepare(`
        SELECT
          s.*,
          og.path as default_og_image_path,
          icon.path as site_icon_path,
          logo.path as logo_path
        FROM settings s
        LEFT JOIN media og ON s.default_og_image_id = og.id
        LEFT JOIN media icon ON s.site_icon_id = icon.id
        LEFT JOIN media logo ON s.logo_media_id = logo.id
        WHERE s.id = 1
      `)
      .first<SiteSettings>();

    if (!settings) {
      // Initialize settings if not exists
      await db.prepare("INSERT OR IGNORE INTO settings (id) VALUES (1)").run();
      const newSettings = await db
        .prepare("SELECT * FROM settings WHERE id = 1")
        .first<SiteSettings>();
      return NextResponse.json({ success: true, data: newSettings });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

interface UpdateSettingsBody {
  site_url?: string | null;
  site_name?: string | null;
  site_description?: string | null;
  meta_title_suffix?: string | null;
  default_og_image_id?: number | null;
  site_icon_id?: number | null;
  logo_media_id?: number | null;
  logo_text_display?: string | null;
  copyright_text?: string | null;
  posts_per_page?: number;
  contact_email?: string | null;
  social_twitter?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_linkedin?: string | null;
  social_youtube?: string | null;
  social_github?: string | null;
  social_substack?: string | null;
}

// PUT /admin/api/settings - Update site settings
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const body = (await request.json()) as UpdateSettingsBody;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    // Build dynamic update query
    const fields: (keyof UpdateSettingsBody)[] = [
      "site_url",
      "site_name",
      "site_description",
      "meta_title_suffix",
      "default_og_image_id",
      "site_icon_id",
      "logo_media_id",
      "logo_text_display",
      "copyright_text",
      "posts_per_page",
      "contact_email",
      "social_twitter",
      "social_facebook",
      "social_instagram",
      "social_linkedin",
      "social_youtube",
      "social_github",
      "social_substack",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(body[field] as string | number | null);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = datetime('now')");

    await db
      .prepare(`UPDATE settings SET ${updates.join(", ")} WHERE id = 1`)
      .bind(...params)
      .run();

    // Get updated settings with media paths
    const settings = await db
      .prepare(`
        SELECT
          s.*,
          og.path as default_og_image_path,
          icon.path as site_icon_path,
          logo.path as logo_path
        FROM settings s
        LEFT JOIN media og ON s.default_og_image_id = og.id
        LEFT JOIN media icon ON s.site_icon_id = icon.id
        LEFT JOIN media logo ON s.logo_media_id = logo.id
        WHERE s.id = 1
      `)
      .first<SiteSettings>();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
