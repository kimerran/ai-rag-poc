import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { LoginSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid input", details: result.error.errors },
        { status: 400 }
      );
    }

    const { username, password } = result.data;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await signToken({ userId: user.id, role: user.role });
    setAuthCookie(token);

    return NextResponse.json({
      data: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
