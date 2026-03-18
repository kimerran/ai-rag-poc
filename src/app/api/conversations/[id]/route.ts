import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: authUser.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ data: conversation });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: authUser.userId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Conversation not found" }, { status: 404 });
    }
    await prisma.conversation.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
