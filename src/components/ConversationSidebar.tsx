"use client";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCreate}
          className="w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${
                activeId === conv.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-1 text-xs"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
