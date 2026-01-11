import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuthor } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import type { User } from "@/types/user";

// GET /admin/api/account - Get current user's account
export async function GET() {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();

    const user = await db
      .prepare(
        `SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
                created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(auth.user.id)
      .first<User>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch account" },
      { status: 500 }
    );
  }
}

// PUT /admin/api/account - Update current user's account
export async function PUT(request: NextRequest) {
  const auth = await requireAuthor();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();

    const body = (await request.json()) as {
      name?: string;
      bio?: string | null;
      password?: string;
    };

    // Build update query - users can only update name, bio, and password
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { success: false, error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updates.push("name = ?");
      values.push(body.name.trim());
    }

    if (body.bio !== undefined) {
      updates.push("bio = ?");
      values.push(body.bio);
    }

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const passwordHash = await hashPassword(body.password);
      updates.push("password_hash = ?");
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      // No updates, return current user
      const user = await db
        .prepare(
          `SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
                  created_at, updated_at
           FROM users WHERE id = ?`
        )
        .bind(auth.user.id)
        .first<User>();

      return NextResponse.json({ success: true, data: user });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(auth.user.id);

    await db
      .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    // Fetch updated user
    const updated = await db
      .prepare(
        `SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
                created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(auth.user.id)
      .first<User>();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update account" },
      { status: 500 }
    );
  }
}
