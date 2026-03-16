// src/windows/Timeline.tsx
import { useState, useMemo } from "react";
import { useEntries } from "../hooks/useEntries";
import { useClients } from "../hooks/useClients";
import { useProjects } from "../hooks/useProjects";
import { useTimer } from "../hooks/useTimer";
import { TimeBlock } from "../components/TimeBlock";
import { EditPopover } from "../components/EditPopover";
import type { Entry } from "../lib/types";

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type TimelineView = "day" | "week";

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRange(view: TimelineView): [string, string] {
  const today = new Date();
  if (view === "day") {
    const d = localDateStr(today);
    return [d + "T00:00:00", d + "T23:59:59"];
  }
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  return [localDateStr(from) + "T00:00:00", localDateStr(today) + "T23:59:59"];
}

function groupByDate(entries: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  entries.forEach(e => {
    const date = e.startedAt.slice(0, 10);
    map.set(date, [...(map.get(date) ?? []), e]);
  });
  return map;
}

export function Timeline() {
  const [view, setView] = useState<TimelineView>("day");
  const [from, to] = useMemo(() => getRange(view), [view]);
  const { entries, updateEntry } = useEntries(from, to);
  const { clients } = useClients();
  const { projects } = useProjects();
  const { runningEntry } = useTimer();
  const [editing, setEditing] = useState<Entry | null>(null);

  const totalMs = useMemo(() => entries
    .filter(e => e.stoppedAt)
    .reduce((sum, e) => sum + new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime(), 0),
    [entries]);

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  return (
    <div className="p-4 font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="text-zinc-400 text-sm">
          {view === "day" ? "Today" : "This week"}: <span className="text-white">{formatMs(totalMs)}</span>
          {" "}across <span className="text-white">{entries.length}</span> entries
        </div>
        <div className="flex items-center gap-3">
          {runningEntry && <div className="text-red-400 text-xs animate-pulse">● Recording</div>}
          <div className="flex gap-1">
            {(["day", "week"] as TimelineView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-2 py-1 text-xs rounded ${view === v ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "day" ? (
        <div className="flex flex-col gap-2">
          {entries.map(entry => (
            <TimeBlock key={entry.id} entry={entry} clients={clients} onClick={setEditing} />
          ))}
          {entries.length === 0 && (
            <div className="text-zinc-600 text-sm text-center py-8">No entries today. Press Ctrl+K to start tracking.</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, dayEntries]) => (
            <div key={date}>
              <div className="text-xs text-zinc-500 mb-2 tracking-wider">{date}</div>
              <div className="flex flex-col gap-2">
                {dayEntries.map(entry => (
                  <TimeBlock key={entry.id} entry={entry} clients={clients} onClick={setEditing} />
                ))}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-zinc-600 text-sm text-center py-8">No entries this week. Press Ctrl+K to start tracking.</div>
          )}
        </div>
      )}

      {editing && (
        <EditPopover
          entry={editing}
          clients={clients}
          projects={projects}
          onSave={updateEntry}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
