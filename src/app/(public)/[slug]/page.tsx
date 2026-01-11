import { getDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getCustomerSubdomain } from "@/lib/stream";
import { getImageUrl } from "@/lib/image";
import { createExcerpt } from "@/lib/html";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResponsiveImageContainer } from "@/components/ResponsiveImage";
import StreamPlayer from "@/components/StreamPlayer";
import HtmlContent from "@/components/HtmlContent";
import type { Metadata } from "next";

interface Page {
  id: number;
  slug: string;
  title: string;
  body: string;
  author: string;
  authored_on: string;
  media_id?: number;
  media_path?: string;
  media_alt?: string;
  media_width?: number;
  media_height?: number;
  media_type?: "image" | "video";
  media_stream_uid?: string;
  media_thumbnail_url?: string;
  media_stream_status?: string;
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const db = getDB();
    const page = await db
      .prepare(
        `SELECT p.*, m.path as media_path, m.alt as media_alt,
                m.width as media_width, m.height as media_height,
                m.type as media_type, m.stream_uid as media_stream_uid,
                m.thumbnail_url as media_thumbnail_url,
                m.stream_status as media_stream_status
         FROM pages p
         LEFT JOIN media m ON p.media_id = m.id
         WHERE p.slug = ? AND p.published = 1`
      )
      .bind(slug)
      .first<Page>();

    return page || null;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return { title: "Page Not Found" };
  }

  const description = createExcerpt(page.body, 160);
  const url = `https://peabod.com/${slug}`;

  // Generate OG image URL
  // For videos, use the thumbnail; for images, use the image path
  const ogImage = page.media_type === "video" && page.media_thumbnail_url
    ? page.media_thumbnail_url
    : page.media_path
      ? getImageUrl(page.media_path, {
          width: 1200,
          height: 630,
          fit: "cover",
          quality: 70,
        })
      : undefined;

  return {
    title: page.title,
    description,
    openGraph: {
      type: "website",
      title: page.title,
      description,
      url,
      siteName: "Peabod",
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: page.media_alt || page.title,
          },
        ],
      }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: page.title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [page, user] = await Promise.all([getPage(slug), getSessionUser()]);

  if (!page) {
    notFound();
  }

  const canEdit = user && (user.role === "admin" || user.role === "editor");
  const isVideo = page.media_type === "video";
  const customerSubdomain = isVideo ? getCustomerSubdomain() : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-foreground">{page.title}</h1>
        {canEdit && (
          <Link
            href={`/admin/pages/${page.id}/edit`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            Edit Page
          </Link>
        )}
      </div>

      {/* Featured Media - Image or Video */}
      {page.media_id && (
        <figure className="mb-8">
          {isVideo && page.media_stream_uid && page.media_stream_status === "ready" && customerSubdomain ? (
            <StreamPlayer
              uid={page.media_stream_uid}
              customerSubdomain={customerSubdomain}
              title={page.title}
              poster={page.media_thumbnail_url || undefined}
              controls
              className="rounded-lg shadow-md overflow-hidden"
            />
          ) : isVideo ? (
            <div className="aspect-video bg-gray-100 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-gray-500">
                {page.media_stream_status === "processing" ? "Video processing..." : "Video not available"}
              </span>
            </div>
          ) : page.media_path ? (
            <ResponsiveImageContainer
              path={page.media_path}
              alt={page.media_alt || page.title}
              preset="hero"
              priority
              containerClassName="rounded-lg shadow-md"
            />
          ) : null}
        </figure>
      )}

      <HtmlContent content={page.body} />
    </div>
  );
}
