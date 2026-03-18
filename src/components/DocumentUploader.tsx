"use client";

import { useState, useRef, DragEvent } from "react";

export default function DocumentUploader({ onUpload }: { onUpload: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    setUploading(false);

    if (res.ok) {
      onUpload();
    } else {
      const json = await res.json();
      setError(json.message ?? "Upload failed");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />
      {uploading ? (
        <div className="text-indigo-600 font-medium">Uploading...</div>
      ) : (
        <>
          <div className="text-4xl mb-2">📁</div>
          <p className="text-gray-600 font-medium">Drop a file here or click to upload</p>
          <p className="text-gray-400 text-sm mt-1">PDF, TXT, MD — max 10 MB</p>
        </>
      )}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
