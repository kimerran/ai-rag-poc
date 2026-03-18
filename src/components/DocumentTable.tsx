"use client";

import { useState } from "react";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  READY: "bg-green-100 text-green-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
};

export default function DocumentTable({
  documents,
  onDelete,
}: {
  documents: Document[];
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No documents yet. Upload your first document above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Chunks</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{doc.fileName}</td>
              <td className="px-4 py-3 text-gray-500 uppercase">{doc.fileType}</td>
              <td className="px-4 py-3 text-gray-500">{formatBytes(doc.fileSize)}</td>
              <td className="px-4 py-3 text-gray-500">{doc.chunkCount}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                {confirmId === doc.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(doc.id); setConfirmId(null); }}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Confirm
                    </button>
                    <button onClick={() => setConfirmId(null)} className="text-gray-500 text-xs">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(doc.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
