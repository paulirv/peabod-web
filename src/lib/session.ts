import { cookies } from "next/headers";
import { getDB } from "./db";
import type { UserRole, SessionUser } from "@/types/user";

export type { SessionUser };

const SESSION_COOKIE_NAME = "peabod_session";
const SESSION_DURATION_DAYS = 30;

/**
 * Convert Uint8Array to hex string
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a cryptographically secure session ID
 */
export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const db = getDB();
  const sessionId = generateSessionId();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(sessionId, userId, expiresAt, ipAddress || null, userAgent || null)
    .run();

  return sessionId;
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

/**
 * Get the current session user from cookies
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) return null;

    const db = getDB();
    const result = await db
      .prepare(
        `SELECT u.id, u.email, u.name, u.bio, u.avatar_media_id, u.role, s.expires_at
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = ? AND u.is_active = 1 AND u.is_approved = 1`
      )
      .bind(sessionId)
      .first<{
        id: number;
        email: string;
        name: string;
        bio: string | null;
        avatar_media_id: number | null;
        role: UserRole;
        expires_at: string;
      }>();

    if (!result) return null;

    // Check expiration
    if (new Date(result.expires_at) < new Date()) {
      await deleteSession(sessionId);
      return null;
    }

    return {
      id: result.id,
      email: result.email,
      name: result.name,
      bio: result.bio,
      avatar_media_id: result.avatar_media_id,
      role: result.role || "author",
      is_superadmin: result.role === "admin",
    };
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDB();
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: number): Promise<void> {
  const db = getDB();
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDB();
  const result = await db
    .prepare("DELETE FROM sessions WHERE expires_at < datetime('now')")
    .run();
  return result.meta.changes || 0;
}

/**
 * Get the session cookie name (for external use)
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
