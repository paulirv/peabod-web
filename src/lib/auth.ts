import { headers } from "next/headers";

/**
 * Check if the current request is from an authenticated CMS admin.
 *
 * When Zero Trust is configured with a Bypass policy for the frontend,
 * authenticated users will have their JWT passed via CF-Access-JWT-Assertion header.
 *
 * Returns the user's email if authenticated, null otherwise.
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  try {
    const headersList = await headers();
    const jwt = headersList.get("cf-access-jwt-assertion");

    if (!jwt) {
      return null;
    }

    // Decode the JWT payload (base64url encoded)
    // JWT format: header.payload.signature
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Return the email claim from the JWT
    return payload.email || null;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return null;
  }
}

/**
 * Check if the current user is an authenticated admin.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}
