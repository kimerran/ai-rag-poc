import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { retrieveChunks, streamRagResponse, chunksToSources } from "@/lib/rag";
import { ChatSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    const { allowed } = checkRateLimit(authUser.userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Too many requests. Please wait before sending another message." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = ChatSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid input", details: result.error.errors },
        { status: 400 }
      );
    }

    const { conversationId, query, documentIds } = result.data;
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: authUser.userId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Conversation not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Step 1: Retrieve chunks
          const { chunks, timeMs } = await retrieveChunks(query, documentIds);
          send("retrieval", { timeMs, chunks });

          // Step 2: Stream response
          let fullResponse = "";
          for await (const token of streamRagResponse(query, chunks)) {
            fullResponse += token;
            send("token", { text: token });
          }

          // Step 3: Send sources
          const sources = chunksToSources(chunks);
          send("sources", { sources });

          // Step 4: Persist messages
          await prisma.message.create({
            data: { role: "USER", content: query, conversationId },
          });
          const assistantMessage = await prisma.message.create({
            data: { role: "ASSISTANT", content: fullResponse, sources, conversationId },
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          send("done", { messageId: assistantMessage.id });
        } catch (err) {
          console.error("Chat stream error:", err);
          send("error", { message: "An error occurred while processing your request." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
