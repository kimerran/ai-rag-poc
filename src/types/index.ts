export interface AuthUser {
  userId: string;
  role: string;
}

export interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  fileName: string;
  userId: string;
}

export interface RetrievedChunk {
  chunkId: string;
  score: number;
  content: string;
  documentName: string;
  chunkIndex: number;
}

export interface Source {
  chunkId: string;
  documentName: string;
  content: string;
  score: number;
}
