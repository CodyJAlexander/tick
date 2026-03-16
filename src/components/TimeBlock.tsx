// src/components/TimeBlock.tsx
import type { Entry, Client } from "../lib/types";

interface Props {
  entry: Entry;
  clients: Client[];
  onClick: (entry: Entry) => void;
}

function formatDuration(startedAt: string, stoppedAt?: string): string {
  const end = stoppedAt ? new Date(stoppedAt) : new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TimeBlock({ entry, clients, onClick }: Props) {
  const client = clients.find(c => c.id === entry.clientId);
  const color = client?.color ?? "#6366f1";
  const isRunning = !entry.stoppedAt;

  return (
    <div
      onClick={() => onClick(entry)}
      className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer hover:opacity-80 transition-opacity ${isRunning ? "animate-pulse" : ""}`}
      style={{ borderColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex-1 font-mono text-sm text-white truncate">{entry.task}</div>
      {client && <span className="text-xs font-mono" style={{ color }}>{client.name}</span>}
      <span className="text-xs font-mono text-zinc-400">{formatDuration(entry.startedAt, entry.stoppedAt)}</span>
    </div>
  );
}
