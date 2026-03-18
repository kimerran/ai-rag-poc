"use client";

import { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { Source } from "@/types";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: Source[];
}

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; fileName: string }[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((j) => setMessages(j.data?.messages ?? []));

    fetch("/api/documents?status=READY")
      .then((r) => r.json())
      .then((j) => setDocuments(j.data ?? []));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!query.trim() || streaming) return;
    const userQuery = query.trim();
    setQuery("");
    setStreaming(true);

    const userMsg: Message = { id: `temp-${Date.now()}`, role: "USER", content: userQuery };
    const assistantMsg: Message = { id: `temp-assistant-${Date.now()}`, role: "ASSISTANT", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        query: userQuery,
        documentIds: selectedDocs.length > 0 ? selectedDocs : undefined,
      }),
    });

    if (!res.ok || !res.body) {
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sources: Source[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          // handled by next data line
        } else if (line.startsWith("data: ")) {
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text !== undefined) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "ASSISTANT") {
                  copy[copy.length - 1] = { ...last, content: last.content + parsed.text };
                }
                return copy;
              });
            }
            if (parsed.sources) {
              sources = parsed.sources;
            }
            if (parsed.messageId) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "ASSISTANT") {
                  copy[copy.length - 1] = { ...last, id: parsed.messageId, sources };
                }
                return copy;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            Ask a question about your documents
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-2">
        {documents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center">Filter docs:</span>
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() =>
                  setSelectedDocs((prev) =>
                    prev.includes(doc.id) ? prev.filter((d) => d !== doc.id) : [...prev, doc.id]
                  )
                }
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  selectedDocs.includes(doc.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {doc.fileName}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask a question... (Enter to send)"
            rows={2}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !query.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium self-end"
          >
            {streaming ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
