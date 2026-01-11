import { NextResponse } from "next/server";
import { requireAuthor } from "@/lib/api-auth";
import { getCustomerSubdomain } from "@/lib/stream";

/**
 * GET /admin/api/video/config
 * Returns Stream configuration for client-side video player
 */
export async function GET() {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const customerSubdomain = getCustomerSubdomain();

    return NextResponse.json({
      success: true,
      data: {
        customerSubdomain,
      },
    });
  } catch (error) {
    console.error("Error getting video config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get video config" },
      { status: 500 }
    );
  }
}
