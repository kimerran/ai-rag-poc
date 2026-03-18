"use client";

import { useState, useEffect, useCallback } from "react";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentTable from "@/components/DocumentTable";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const json = await res.json();
      setDocuments(json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing documents
  useEffect(() => {
    const processing = documents.some((d) => d.status === "PROCESSING" || d.status === "PENDING");
    if (!processing) return;

    const interval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
      <DocumentUploader onUpload={fetchDocuments} />
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <DocumentTable documents={documents} onDelete={handleDelete} />
      )}
    </div>
  );
}
