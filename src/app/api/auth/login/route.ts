import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";
import type { UserRole } from "@/types/user";

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = getDB();

    const user = await db
      .prepare(
        "SELECT id, email, name, password_hash, role, is_active, is_approved FROM users WHERE email = ?"
      )
      .bind(email.toLowerCase())
      .first<{
        id: number;
        email: string;
        name: string;
        password_hash: string;
        role: UserRole;
        is_active: number;
        is_approved: number;
      }>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: "Account is deactivated" },
        { status: 403 }
      );
    }

    if (!user.is_approved) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account is pending admin approval",
          pending_approval: true,
        },
        { status: 403 }
      );
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const ipAddress = request.headers.get("cf-connecting-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;
    const sessionId = await createSession(user.id, ipAddress, userAgent);
    await setSessionCookie(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "author",
        is_superadmin: user.role === "admin",
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log in" },
      { status: 500 }
    );
  }
}
