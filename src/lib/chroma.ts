import { ChromaClient } from "chromadb";

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL ?? "http://localhost:8000",
  auth: {
    provider: "token",
    credentials: process.env.CHROMA_AUTH_TOKEN ?? "rag-explorer-token",
  },
});

export async function getCollection() {
  return chroma.getOrCreateCollection({
    name: process.env.CHROMA_COLLECTION ?? "rag_chunks",
    metadata: { "hnsw:space": "cosine" },
  });
}

export { chroma };
