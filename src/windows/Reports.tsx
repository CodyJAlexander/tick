import { useState, useMemo } from "react";
import { useEntries } from "../hooks/useEntries";
import { useClients } from "../hooks/useClients";
import { useProjects } from "../hooks/useProjects";
import { generateCsv, downloadCsv } from "../lib/export";
import type { Entry } from "../lib/types";

type Range = "day" | "week" | "month" | "custom";

function getRangeDates(range: Range, customFrom?: string, customTo?: string): [string, string] {
  const now = new Date();
  if (range === "custom" && customFrom && customTo) {
    return [customFrom + "T00:00:00Z", customTo + "T23:59:59Z"];
  }
  const from = new Date(now);
  if (range === "week") from.setDate(now.getDate() - 6);
  else if (range === "month") from.setDate(now.getDate() - 29);
  return [from.toISOString().slice(0, 10) + "T00:00:00Z", now.toISOString().slice(0, 10) + "T23:59:59Z"];
}

function DailyBarChart({ entries }: { entries: Entry[] }) {
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    entries.filter(e => e.stoppedAt).forEach(e => {
      const date = e.startedAt.slice(0, 10);
      const ms = new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime();
      map.set(date, (map.get(date) ?? 0) + ms);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  if (byDay.length === 0) return null;
  const maxMs = Math.max(...byDay.map(([, ms]) => ms), 1);

  return (
    <div className="flex items-end gap-1 h-16 mb-4">
      {byDay.map(([date, ms]) => (
        <div key={date} className="flex flex-col items-center flex-1 gap-1">
          <div className="w-full bg-indigo-600 rounded-t" style={{ height: `${(ms / maxMs) * 100}%` }} title={`${date}: ${(ms/3600000).toFixed(1)}h`} />
          <div className="text-zinc-600 text-[9px] font-mono">{date.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

export function Reports() {
  const [range, setRange] = useState<Range>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [from, to] = getRangeDates(range, customFrom, customTo);
  const { entries } = useEntries(from, to);
  const { clients } = useClients();
  const { projects } = useProjects();

  const summaryByClient = useMemo(() => {
    const map = new Map<number | undefined, { name: string; ms: number }>();
    entries.filter(e => e.stoppedAt).forEach(e => {
      const ms = new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime();
      const key = e.clientId;
      const name = clients.find(c => c.id === key)?.name ?? "(No client)";
      const existing = map.get(key);
      map.set(key, { name, ms: (existing?.ms ?? 0) + ms });
    });
    return [...map.values()].sort((a, b) => b.ms - a.ms);
  }, [entries, clients]);

  const handleExport = () => {
    const csv = generateCsv(entries, clients, projects);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `tick-export-${date}.csv`);
  };

  const fmtHrs = (ms: number) => (ms / 3600000).toFixed(1) + "h";

  return (
    <div className="p-4 font-mono">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {(["day", "week", "month", "custom"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded transition-colors ${range === r ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-white"}`}>
              {r}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex gap-2 items-center">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1" />
            <span className="text-zinc-500 text-xs">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1" />
          </div>
        )}
        <button onClick={handleExport}
          className="ml-auto text-xs border border-zinc-600 text-zinc-400 hover:text-white hover:border-zinc-400 px-3 py-1 rounded transition-colors">
          Export CSV
        </button>
      </div>

      <DailyBarChart entries={entries} />

      <div className="flex flex-col gap-2 mb-6">
        {summaryByClient.length === 0 && (
          <div className="text-zinc-600 text-sm text-center py-8">No completed entries in this range.</div>
        )}
        {summaryByClient.map(({ name, ms }) => (
          <div key={name} className="flex items-center justify-between border border-zinc-800 rounded px-3 py-2">
            <span className="text-sm text-white">{name}</span>
            <span className="text-sm text-zinc-400">{fmtHrs(ms)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
