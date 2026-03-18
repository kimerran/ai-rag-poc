import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ingestDocument } from "@/lib/ingestion";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: authUser.userId },
    });
    if (!document) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Document not found" }, { status: 404 });
    }

    ingestDocument(params.id).catch((err) =>
      console.error(`Re-ingestion failed for ${params.id}:`, err)
    );

    return NextResponse.json({ data: { accepted: true } }, { status: 202 });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
