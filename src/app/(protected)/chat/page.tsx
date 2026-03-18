"use client";

import { useState, useEffect } from "react";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatWindow from "@/components/ChatWindow";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const json = await res.json();
      setConversations(json.data);
    }
  };

  const createConversation = async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const json = await res.json();
      setConversations((prev) => [json.data, ...prev]);
      setActiveConversationId(json.data.id);
    }
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onCreate={createConversation}
        onDelete={deleteConversation}
      />
      <div className="flex-1">
        {activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg">Select or create a conversation</p>
              <button
                onClick={createConversation}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
