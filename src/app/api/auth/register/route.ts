import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const { email, password, name } = body;

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

    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const db = getDB();

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

    // Check if this is the first user (will be auto-approved as admin)
    const userCount = await db
      .prepare("SELECT COUNT(*) as count FROM users")
      .first<{ count: number }>();

    const isFirstUser = !userCount || userCount.count === 0;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user - first user is auto-approved admin, others require approval
    const result = await db
      .prepare(
        `INSERT INTO users (email, password_hash, name, role, is_approved, approved_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        email.toLowerCase(),
        passwordHash,
        name.trim(),
        isFirstUser ? "admin" : "author",
        isFirstUser ? 1 : 0,
        isFirstUser ? new Date().toISOString() : null
      )
      .run();

    const userId = result.meta.last_row_id as number;

    // Only create session and set cookie for auto-approved users (first user)
    if (isFirstUser) {
      const ipAddress = request.headers.get("cf-connecting-ip") || undefined;
      const userAgent = request.headers.get("user-agent") || undefined;
      const sessionId = await createSession(userId, ipAddress, userAgent);
      await setSessionCookie(sessionId);

      return NextResponse.json(
        {
          success: true,
          data: {
            id: userId,
            email: email.toLowerCase(),
            name: name.trim(),
            role: "admin",
            is_superadmin: true,
          },
        },
        { status: 201 }
      );
    }

    // For non-first users, don't auto-login, return pending approval status
    return NextResponse.json(
      {
        success: true,
        pending_approval: true,
        message:
          "Your account has been created and is pending admin approval. You will be able to log in once approved.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register user" },
      { status: 500 }
    );
  }
}
