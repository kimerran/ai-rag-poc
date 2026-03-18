import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "./prisma";
import { downloadFile } from "./storage";
import { generateEmbeddings } from "./embeddings";
import { getCollection } from "./chroma";

export async function ingestDocument(documentId: string): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  });

  try {
    const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    const fileBuffer = await downloadFile(doc.storagePath);
    const text = await extractText(fileBuffer, doc.fileType);
    const chunks = await splitText(text);

    const BATCH_SIZE = 64;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch);
      allEmbeddings.push(...embeddings);
    }

    const collection = await getCollection();
    await collection.upsert({
      ids: chunks.map((_, idx) => `${documentId}_${idx}`),
      embeddings: allEmbeddings,
      documents: chunks,
      metadatas: chunks.map((_, idx) => ({
        documentId,
        chunkIndex: idx,
        fileName: doc.fileName,
        userId: doc.userId,
      })),
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY", chunkCount: chunks.length },
    });
  } catch (error) {
    console.error(`Ingestion failed for document ${documentId}:`, error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  const type = fileType.toLowerCase().replace(".", "");
  if (type === "txt" || type === "md") {
    let text = buffer.toString("utf-8");
    if (type === "md") {
      // Strip YAML frontmatter
      text = text.replace(/^---[\s\S]*?---\n/, "");
    }
    return text;
  }
  if (type === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}

async function splitText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}
