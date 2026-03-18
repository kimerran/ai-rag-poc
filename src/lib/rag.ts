import { generateEmbedding } from "./embeddings";
import { getCollection } from "./chroma";
import Anthropic from "@anthropic-ai/sdk";
import type { RetrievedChunk, Source } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

export async function retrieveChunks(
  query: string,
  documentIds?: string[],
  nResults = 5
): Promise<{ chunks: RetrievedChunk[]; timeMs: number }> {
  const start = Date.now();
  const queryEmbedding = await generateEmbedding(query);

  const collection = await getCollection();
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    where: documentIds && documentIds.length > 0
      ? { documentId: { $in: documentIds } }
      : undefined,
    include: ["documents", "metadatas", "distances"],
  });

  const timeMs = Date.now() - start;
  const chunks: RetrievedChunk[] = [];

  if (results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      const meta = results.metadatas?.[0]?.[i] as Record<string, unknown> | null;
      const distance = results.distances?.[0]?.[i] ?? 1;
      chunks.push({
        chunkId: results.ids[0][i],
        score: 1 - (distance as number),
        content: results.documents?.[0]?.[i] ?? "",
        documentName: (meta?.fileName as string) ?? "Unknown",
        chunkIndex: (meta?.chunkIndex as number) ?? 0,
      });
    }
  }

  return { chunks, timeMs };
}

function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  const contextParts = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}] (from "${c.documentName}", chunk ${c.chunkIndex}, relevance: ${c.score.toFixed(2)}):\n<context>\n${c.content}\n</context>`
    )
    .join("\n\n");

  return `You are a helpful assistant that answers questions based ONLY on the provided context.
If the context does not contain enough information, say so honestly.
Always cite which source(s) you used by referencing [Source N].

Context:
${contextParts}`;
}

export async function* streamRagResponse(
  query: string,
  chunks: RetrievedChunk[]
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(chunks);

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: query }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

export function chunksToSources(chunks: RetrievedChunk[]): Source[] {
  return chunks.map((c) => ({
    chunkId: c.chunkId,
    documentName: c.documentName,
    content: c.content,
    score: c.score,
  }));
}
