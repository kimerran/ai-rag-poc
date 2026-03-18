"use client";

import { useState } from "react";
import SourceCard from "./SourceCard";
import type { Source } from "@/types";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: Source[];
}

export default function MessageBubble({ message }: { message: Message }) {
  const [showSources, setShowSources] = useState(false);

  if (message.role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-w-[85%]">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
        {message.content || <span className="text-gray-400 animate-pulse">Thinking...</span>}
      </div>
      {message.sources && message.sources.length > 0 && (
        <div>
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {showSources ? "Hide" : "Show"} sources ({message.sources.length})
          </button>
          {showSources && (
            <div className="mt-2 space-y-2">
              {message.sources.map((source, i) => (
                <SourceCard key={i} source={source} index={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
