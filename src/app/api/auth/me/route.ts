import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

// GET - Get current user
// Returns 200 with data: null if not authenticated (not an error state)
export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ success: true, data: null });
    }

    // Get avatar URL if exists
    const db = getDB();
    let avatarPath = null;
    if (user.avatar_media_id) {
      const media = await db
        .prepare("SELECT path FROM media WHERE id = ?")
        .bind(user.avatar_media_id)
        .first<{ path: string }>();
      avatarPath = media?.path || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        avatar_path: avatarPath,
      },
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user" },
      { status: 500 }
    );
  }
}

interface UpdateProfileBody {
  name?: string;
  bio?: string;
  avatar_media_id?: number | null;
  current_password?: string;
  new_password?: string;
}

// PATCH - Update profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UpdateProfileBody;
    const { name, bio, avatar_media_id, current_password, new_password } = body;

    const db = getDB();
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (bio !== undefined) {
      updates.push("bio = ?");
      params.push(bio);
    }
    if (avatar_media_id !== undefined) {
      updates.push("avatar_media_id = ?");
      params.push(avatar_media_id);
    }

    // Handle password change
    if (new_password !== undefined) {
      if (!current_password) {
        return NextResponse.json(
          { success: false, error: "Current password is required" },
          { status: 400 }
        );
      }
      if (new_password.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Verify current password
      const userWithPassword = await db
        .prepare("SELECT password_hash FROM users WHERE id = ?")
        .bind(user.id)
        .first<{ password_hash: string }>();

      if (!userWithPassword) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const isValidPassword = await verifyPassword(
        current_password,
        userWithPassword.password_hash
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      const newPasswordHash = await hashPassword(new_password);
      updates.push("password_hash = ?");
      params.push(newPasswordHash);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = datetime('now')");
    params.push(user.id);

    await db
      .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    // Return updated user
    const updated = await db
      .prepare(
        "SELECT id, email, name, bio, avatar_media_id FROM users WHERE id = ?"
      )
      .bind(user.id)
      .first();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
