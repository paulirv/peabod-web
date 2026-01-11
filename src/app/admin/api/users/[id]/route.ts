import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import type { User, UserRole } from "@/types/user";

// GET /admin/api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;

    const user = await db
      .prepare(
        `SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
                approved_at, approved_by, email_verified, created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(parseInt(id))
      .first<User>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /admin/api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;
    const userId = parseInt(id);

    const body = (await request.json()) as {
      name?: string;
      bio?: string | null;
      role?: UserRole;
      is_active?: boolean;
      password?: string;
    };

    // Check user exists
    const existing = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first<User>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Superuser (ID 1) role is locked to admin - cannot be changed by anyone
    if (userId === 1 && body.role !== undefined && body.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Superuser role cannot be changed" },
        { status: 403 }
      );
    }

    // Prevent demoting last admin
    if (body.role && body.role !== "admin" && existing.role === "admin") {
      const adminCount = await db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1")
        .first<{ count: number }>();

      if (adminCount && adminCount.count <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot demote the last admin" },
          { status: 400 }
        );
      }
    }

    // Superuser (ID 1) cannot be deactivated
    if (userId === 1 && body.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Superuser cannot be deactivated" },
        { status: 403 }
      );
    }

    // Prevent deactivating last admin
    if (body.is_active === false && existing.role === "admin") {
      const adminCount = await db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1")
        .first<{ count: number }>();

      if (adminCount && adminCount.count <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot deactivate the last admin" },
          { status: 400 }
        );
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name);
    }
    if (body.bio !== undefined) {
      updates.push("bio = ?");
      values.push(body.bio);
    }
    if (body.role !== undefined) {
      updates.push("role = ?");
      values.push(body.role);
    }
    if (body.is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(body.is_active ? 1 : 0);
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
      return NextResponse.json({ success: true, data: existing });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    await db
      .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    // Fetch updated user
    const updated = await db
      .prepare(
        `SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
                approved_at, approved_by, email_verified, created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(userId)
      .first<User>();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /admin/api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;
    const userId = parseInt(id);

    // Check user exists
    const existing = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first<User>();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Superuser (ID 1) cannot be deleted
    if (userId === 1) {
      return NextResponse.json(
        { success: false, error: "Superuser cannot be deleted" },
        { status: 403 }
      );
    }

    // Prevent deleting last admin
    if (existing.role === "admin") {
      const adminCount = await db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1")
        .first<{ count: number }>();

      if (adminCount && adminCount.count <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin" },
          { status: 400 }
        );
      }
    }

    // Prevent self-deletion
    if (userId === auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user (cascade will delete sessions)
    await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
