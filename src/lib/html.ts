/**
 * Strip HTML tags from a string to get plain text.
 * Useful for creating excerpts from HTML content.
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  // Remove HTML tags
  const text = html
    .replace(/<[^>]*>/g, " ") // Replace tags with space
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&amp;/g, "&") // Replace HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();

  return text;
}

/**
 * Create an excerpt from HTML content.
 * Strips HTML tags and truncates to the specified length.
 */
export function createExcerpt(html: string, maxLength: number = 200): string {
  const text = stripHtml(html);

  if (text.length <= maxLength) {
    return text;
  }

  // Find a good break point (end of word)
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}
