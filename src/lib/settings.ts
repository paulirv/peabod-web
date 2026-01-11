import { getDB } from "./db";

export interface PublicSettings {
  site_name: string | null;
  site_description: string | null;
  site_url: string | null;
  meta_title_suffix: string | null;
  site_icon_path: string | null;
  logo_path: string | null;
  logo_text_display: string | null;  // 'none', 'after', 'below'
  copyright_text: string | null;
  social_twitter: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_github: string | null;
  social_substack: string | null;
}

/**
 * Get public site settings (server-side only)
 */
export async function getPublicSettings(): Promise<PublicSettings | null> {
  try {
    const db = getDB();
    const settings = await db
      .prepare(`
        SELECT
          s.site_name,
          s.site_description,
          s.site_url,
          s.meta_title_suffix,
          icon.path as site_icon_path,
          logo.path as logo_path,
          s.logo_text_display,
          s.copyright_text,
          s.social_twitter,
          s.social_facebook,
          s.social_instagram,
          s.social_linkedin,
          s.social_youtube,
          s.social_github,
          s.social_substack
        FROM settings s
        LEFT JOIN media icon ON s.site_icon_id = icon.id
        LEFT JOIN media logo ON s.logo_media_id = logo.id
        WHERE s.id = 1
      `)
      .first<PublicSettings>();

    return settings || null;
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return null;
  }
}

/**
 * Get site name with fallback
 */
export async function getSiteName(): Promise<string> {
  const settings = await getPublicSettings();
  return settings?.site_name || "Site Name";
}
