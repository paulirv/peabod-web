import { MetadataRoute } from 'next';
import { getDB } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://peabod.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const db = getDB();

    // Get published articles
    const { results: articles } = await db
      .prepare(
        `SELECT slug, updated_at FROM articles WHERE published = 1 ORDER BY authored_on DESC`
      )
      .all<{ slug: string; updated_at: string }>();

    const articlePages: MetadataRoute.Sitemap = (articles || []).map((article) => ({
      url: `${baseUrl}/article/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Get published pages
    const { results: pages } = await db
      .prepare(
        `SELECT slug, updated_at FROM pages WHERE published = 1`
      )
      .all<{ slug: string; updated_at: string }>();

    const staticContentPages: MetadataRoute.Sitemap = (pages || []).map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: new Date(page.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...articlePages, ...staticContentPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
