import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import type { User, UserRole } from "@/types/user";

// GET /admin/api/users - List all users with filtering
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const { searchParams } = new URL(request.url);

    const role = searchParams.get("role");
    const status = searchParams.get("status"); // 'pending', 'approved', 'inactive'
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = `
      SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
             approved_at, approved_by, email_verified, created_at, updated_at
      FROM users`;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }

    if (status === "pending") {
      conditions.push("is_approved = 0 AND is_active = 1");
    } else if (status === "approved") {
      conditions.push("is_approved = 1 AND is_active = 1");
    } else if (status === "inactive") {
      conditions.push("is_active = 0");
    }

    if (search) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const { results } = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users";
    const countParams: (string | number)[] = [];

    if (conditions.length > 0) {
      const countConditions: string[] = [];
      if (role) {
        countConditions.push("role = ?");
        countParams.push(role);
      }
      if (status === "pending") {
        countConditions.push("is_approved = 0 AND is_active = 1");
      } else if (status === "approved") {
        countConditions.push("is_approved = 1 AND is_active = 1");
      } else if (status === "inactive") {
        countConditions.push("is_active = 0");
      }
      if (search) {
        countConditions.push("(name LIKE ? OR email LIKE ?)");
        countParams.push(`%${search}%`, `%${search}%`);
      }
      if (countConditions.length > 0) {
        countQuery += " WHERE " + countConditions.join(" AND ");
      }
    }

    const countResult = await db
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>();

    // Get pending count for badge
    const pendingResult = await db
      .prepare("SELECT COUNT(*) as count FROM users WHERE is_approved = 0 AND is_active = 1")
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      data: {
        items: (results || []) as unknown as User[],
        total: countResult?.total || 0,
        pending_count: pendingResult?.count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /admin/api/users - Create a new user (admin creates pre-approved)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const db = getDB();
    const body = (await request.json()) as {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
    };

    const { email, password, name, role = "author" } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (pre-approved since admin is creating)
    const result = await db
      .prepare(
        `INSERT INTO users (email, password_hash, name, role, is_approved, approved_at, approved_by)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(
        email.toLowerCase(),
        passwordHash,
        name.trim(),
        role,
        new Date().toISOString(),
        auth.user.id
      )
      .run();

    const userId = result.meta.last_row_id as number;

    // Fetch created user
    const user = await db
      .prepare(
        `SELECT id, email, name, bio, avatar_media_id, role, is_active, is_approved,
                approved_at, approved_by, email_verified, created_at, updated_at
         FROM users WHERE id = ?`
      )
      .bind(userId)
      .first<User>();

    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
