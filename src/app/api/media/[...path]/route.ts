import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";


function getR2Bucket(): R2Bucket {
  const { env } = getCloudflareContext();
  return env.MEDIA;
}

// GET /api/media/[...path] - Serve an image from R2
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const objectKey = path.join("/");

  try {
    const bucket = getR2Bucket();
    const object = await bucket.get(objectKey);

    if (!object) {
      // In development, try fetching from production as fallback
      if (process.env.NODE_ENV === "development") {
        return fetchFromProduction(objectKey);
      }
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(object.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    // In development, fall back to production if R2 fails
    if (process.env.NODE_ENV === "development") {
      console.log("R2 unavailable locally, proxying from production:", objectKey);
      return fetchFromProduction(objectKey);
    }
    console.error("Error serving media:", error);
    return NextResponse.json(
      { error: "Failed to serve media" },
      { status: 500 }
    );
  }
}

// Fetch image from production (for local development)
async function fetchFromProduction(objectKey: string): Promise<NextResponse> {
  try {
    const prodUrl = `https://peabod.com/api/media/${objectKey}`;
    const response = await fetch(prodUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching from production:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
