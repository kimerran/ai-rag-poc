import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "NOT_FOUND", message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ data: user });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
