import type { Source } from "@/types";

export default function SourceCard({ source, index }: { source: Source; index: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-indigo-700">[Source {index}]</span>
        <span className="text-gray-500">{source.documentName}</span>
        <span className="text-gray-400">score: {source.score.toFixed(3)}</span>
      </div>
      <p className="text-gray-700 line-clamp-3">{source.content}</p>
    </div>
  );
}
