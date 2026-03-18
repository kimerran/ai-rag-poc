const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "voyage-3";

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is not set. Add it to .env.local.");
  }
  return generateVoyageEmbeddings(texts);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

async function generateVoyageEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 64;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI error: ${error}`);
    }

    const data = (await response.json()) as { data: { embedding: number[] }[] };
    allEmbeddings.push(...data.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}

