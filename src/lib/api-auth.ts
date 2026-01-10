import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./session";
import type { UserRole } from "@/types/user";

type AuthResult =
  | {
      authorized: true;
      user: { id: number; email: string; name: string; role: UserRole };
    }
  | { authorized: false; response: NextResponse };

/**
 * Check if the current user has admin role.
 * Only admins can manage users.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

/**
 * Check if the current user has editor or admin role.
 * Editors can manage all content.
 */
export async function requireEditor(): Promise<AuthResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin" && user.role !== "editor") {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Editor access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

/**
 * Check if the current user has any admin section role (admin, editor, or author).
 * Authors can access the admin section to manage their own content.
 */
export async function requireAuthor(): Promise<AuthResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin" && user.role !== "editor" && user.role !== "author") {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Author access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

/**
 * Check if the current user is admin/editor OR owns the resource.
 * Authors can only edit/delete their own content.
 */
export async function requireOwnerOrEditor(
  resourceAuthorId: number | null
): Promise<AuthResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  // Admin and editor can access any content
  if (user.role === "admin" || user.role === "editor") {
    return {
      authorized: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  // Authors can only access their own content
  if (user.role === "author" && resourceAuthorId === user.id) {
    return {
      authorized: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  return {
    authorized: false,
    response: NextResponse.json(
      { success: false, error: "You can only modify your own content" },
      { status: 403 }
    ),
  };
}

/**
 * Get the current session user (convenience export)
 */
export async function getAuthUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Legacy: Check if the current user is a superadmin.
 * @deprecated Use requireAdmin() instead
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  return requireAdmin();
}
