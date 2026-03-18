import { getAuthUserFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const authUser = await getAuthUserFromCookies();
  if (!authUser) redirect("/login");

  const [documents, conversations] = await Promise.all([
    prisma.document.findMany({
      where: { userId: authUser.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.conversation.findMany({
      where: { userId: authUser.userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const docCounts = {
    total: await prisma.document.count({ where: { userId: authUser.userId } }),
    ready: await prisma.document.count({ where: { userId: authUser.userId, status: "READY" } }),
    processing: await prisma.document.count({ where: { userId: authUser.userId, status: "PROCESSING" } }),
    failed: await prisma.document.count({ where: { userId: authUser.userId, status: "FAILED" } }),
  };

  const totalChunks = await prisma.document.aggregate({
    where: { userId: authUser.userId, status: "READY" },
    _sum: { chunkCount: true },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={docCounts.total} />
        <StatCard label="Ready Documents" value={docCounts.ready} color="green" />
        <StatCard label="Processing" value={docCounts.processing} color="yellow" />
        <StatCard label="Chunks Indexed" value={totalChunks._sum.chunkCount ?? 0} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Documents</h2>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents yet. <a href="/documents" className="text-indigo-600 hover:underline">Upload one</a></p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[200px]">{doc.fileName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(doc.status)}`}>{doc.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm">No conversations yet. <a href="/chat" className="text-indigo-600 hover:underline">Start one</a></p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conv) => (
                <li key={conv.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate max-w-[200px]">{conv.title}</span>
                  <span className="text-gray-400 text-xs">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "gray" }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-50 border-gray-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    indigo: "bg-indigo-50 border-indigo-200",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "READY": return "bg-green-100 text-green-700";
    case "PROCESSING": return "bg-yellow-100 text-yellow-700";
    case "FAILED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}
