import { NextRequest, NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, ensureBucket } from "@/lib/storage";
import { ingestDocument } from "@/lib/ingestion";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "MISSING_FILE", message: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "FILE_TOO_LARGE", message: "File exceeds 10 MB limit" }, { status: 413 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedExts = ["pdf", "txt", "md"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ error: "INVALID_FILE_TYPE", message: "Only PDF, TXT, and MD files allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate PDF magic bytes
    if (ext === "pdf" && buffer.slice(0, 4).toString() !== "%PDF") {
      return NextResponse.json({ error: "INVALID_FILE", message: "Invalid PDF file" }, { status: 400 });
    }

    const docId = createId();
    const storagePath = `documents/${authUser.userId}/${docId}.${ext}`;
    const contentType = ext === "pdf" ? "application/pdf" : ext === "md" ? "text/markdown" : "text/plain";

    await ensureBucket();
    await uploadFile(storagePath, buffer, contentType);

    const document = await prisma.document.create({
      data: {
        id: docId,
        fileName: file.name,
        fileType: ext,
        fileSize: file.size,
        storagePath,
        userId: authUser.userId,
        status: "PENDING",
      },
    });

    // Trigger async ingestion (fire and forget)
    ingestDocument(document.id).catch((err) =>
      console.error(`Background ingestion failed for ${document.id}:`, err)
    );

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
