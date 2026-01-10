import { headers } from "next/headers";
import { getSessionUser, type SessionUser } from "./session";

// Re-export SessionUser type for convenience
export type { SessionUser } from "./session";

/**
 * Check if the current request is from a Zero Trust authenticated admin.
 * This is used for /admin/* routes protected by Cloudflare Access.
 *
 * Returns the user's email if authenticated via Zero Trust, null otherwise.
 */
export async function getZeroTrustUser(): Promise<string | null> {
  try {
    const headersList = await headers();
    const jwt = headersList.get("cf-access-jwt-assertion");

    if (!jwt) {
      return null;
    }

    // Decode the JWT payload (base64url encoded)
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Use atob with base64url conversion for Workers compatibility
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    return payload.email || null;
  } catch (error) {
    console.error("Error checking Zero Trust authentication:", error);
    return null;
  }
}

/**
 * Check if the current request is from a Zero Trust admin.
 * @deprecated Use getZeroTrustUser() for clarity
 */
export async function getAuthenticatedUser(): Promise<string | null> {
  return getZeroTrustUser();
}

/**
 * Check if the current user is an authenticated admin (Zero Trust).
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getZeroTrustUser();
  return user !== null;
}

/**
 * Get the current public user (cookie-based session)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Check if current user is logged in (public auth)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

/**
 * Check if current user is the superadmin (user ID 1)
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.is_superadmin ?? false;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
