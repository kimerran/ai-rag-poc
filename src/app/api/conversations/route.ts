import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateConversationSchema, PaginationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const params = PaginationSchema.safeParse(Object.fromEntries(searchParams));
    if (!params.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid params" }, { status: 400 });
    }
    const { page, pageSize } = params.data;
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId: authUser.userId },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.conversation.count({ where: { userId: authUser.userId } }),
    ]);
    return NextResponse.json({ data: conversations, meta: { total, page, pageSize } });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = CreateConversationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid input" }, { status: 400 });
    }

    const title = result.data.title ?? `Conversation ${new Date().toLocaleDateString()}`;
    const conversation = await prisma.conversation.create({
      data: { title, userId: authUser.userId },
    });
    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
