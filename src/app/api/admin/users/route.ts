import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaginationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = PaginationSchema.safeParse(Object.fromEntries(searchParams));
    if (!params.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid params" }, { status: 400 });
    }
    const { page, pageSize } = params.data;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, username: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count(),
    ]);
    return NextResponse.json({ data: users, meta: { total, page, pageSize } });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
