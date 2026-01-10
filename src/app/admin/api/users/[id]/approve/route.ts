import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import type { User } from "@/types/user";

// POST /admin/api/users/[id]/approve - Approve a pending user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { id } = await params;
    const userId = parseInt(id);

    // Check user exists and is pending
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

    if (existing.is_approved) {
      return NextResponse.json(
        { success: false, error: "User is already approved" },
        { status: 400 }
      );
    }

    // Approve user
    await db
      .prepare(
        `UPDATE users SET is_approved = 1, approved_at = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(new Date().toISOString(), auth.user.id, userId)
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
    console.error("Error approving user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve user" },
      { status: 500 }
    );
  }
}

// DELETE /admin/api/users/[id]/approve - Reject/revoke approval
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

    // Prevent revoking own approval
    if (userId === auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot revoke your own approval" },
        { status: 400 }
      );
    }

    // Revoke approval
    await db
      .prepare(
        `UPDATE users SET is_approved = 0, approved_at = NULL, approved_by = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(userId)
      .run();

    // Delete all sessions for this user (log them out)
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();

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
    console.error("Error revoking approval:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke approval" },
      { status: 500 }
    );
  }
}
