// src/popup/StopPopup.tsx
import { useState, useEffect } from "react";
import { commands } from "../lib/tauri";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Entry, Client, Project } from "../lib/types";

interface Props {
  entry: Entry;
  clients: Client[];
  projects: Project[];
  onClose?: () => void;
}

function useElapsed(startedAt: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600000).toString().padStart(2, "0");
  const m = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, "0");
  const s = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function StopPopup({ entry, clients, projects, onClose }: Props) {
  const [task, setTask] = useState(entry.task);
  const [clientId, setClientId] = useState<number | undefined>(entry.clientId);
  const [projectId, setProjectId] = useState<number | undefined>(entry.projectId);
  const elapsed = useElapsed(entry.startedAt);
  const filteredProjects = projects.filter(p => p.clientId === clientId);

  const close = () => { onClose?.(); getCurrentWindow().hide(); };

  const save = async () => {
    await commands.stopEntry({ id: entry.id, task, clientId, projectId, stoppedAt: new Date().toISOString() });
    close();
  };

  const discard = async () => {
    await commands.deleteEntry(entry.id);
    close();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") { save(); return; }
      // Check Shift+Escape BEFORE plain Escape — discard takes priority
      if (e.key === "Escape" && e.shiftKey) { discard(); return; }
      if (e.key === "Escape") { close(); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [task, clientId, projectId]);

  return (
    <div className="h-screen bg-zinc-900 flex flex-col justify-center p-4 gap-2 font-mono">
      <div className="text-red-400 text-sm">● {elapsed}</div>
      <input
        value={task}
        onChange={e => setTask(e.target.value)}
        className="bg-transparent border-b border-zinc-600 text-white text-sm outline-none py-1"
      />
      <select
        value={clientId ?? ""}
        onChange={e => { setClientId(e.target.value ? Number(e.target.value) : undefined); setProjectId(undefined); }}
        className="bg-zinc-800 text-white text-xs border border-zinc-600 rounded px-2 py-1"
      >
        <option value="">No client</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select
        value={projectId ?? ""}
        onChange={e => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
        className="bg-zinc-800 text-white text-xs border border-zinc-600 rounded px-2 py-1"
        disabled={!clientId}
      >
        <option value="">No project</option>
        {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="flex justify-between items-center mt-1">
        <button onClick={discard} className="text-zinc-500 text-xs hover:text-red-400">✕ Discard</button>
        <div className="text-xs text-zinc-600">↵ save &nbsp; esc dismiss</div>
      </div>
    </div>
  );
}
