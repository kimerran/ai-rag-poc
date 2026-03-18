import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { getCollection } from "@/lib/chroma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: authUser.userId },
    });
    if (!document) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ data: document });
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
    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: authUser.userId },
    });
    if (!document) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Document not found" }, { status: 404 });
    }

    // Delete from ChromaDB
    try {
      const collection = await getCollection();
      await collection.delete({ where: { documentId: params.id } });
    } catch (err) {
      console.error("ChromaDB delete error:", err);
    }

    // Delete from storage
    try {
      await deleteFile(document.storagePath);
    } catch (err) {
      console.error("Storage delete error:", err);
    }

    await prisma.document.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
