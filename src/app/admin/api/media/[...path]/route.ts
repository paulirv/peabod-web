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
  try {
    const bucket = getR2Bucket();
    const { path } = await params;
    const objectKey = path.join("/");

    const object = await bucket.get(objectKey);

    if (!object) {
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
    console.error("Error serving media:", error);
    return NextResponse.json(
      { error: "Failed to serve media" },
      { status: 500 }
    );
  }
}
