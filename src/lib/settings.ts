import { getDB } from "./db";

export interface PublicSettings {
  site_name: string | null;
  site_description: string | null;
  site_url: string | null;
  meta_title_suffix: string | null;
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
          site_name,
          site_description,
          site_url,
          meta_title_suffix,
          copyright_text,
          social_twitter,
          social_facebook,
          social_instagram,
          social_linkedin,
          social_youtube,
          social_github,
          social_substack
        FROM settings
        WHERE id = 1
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
