// src/components/EditPopover.tsx
import { useState } from "react";
import type { Entry, Client, Project, UpdateEntryInput } from "../lib/types";

interface Props {
  entry: Entry;
  clients: Client[];
  projects: Project[];
  onSave: (input: UpdateEntryInput) => Promise<void>;
  onClose: () => void;
}

export function EditPopover({ entry, clients, projects, onSave, onClose }: Props) {
  const [task, setTask] = useState(entry.task);
  const [clientId, setClientId] = useState(entry.clientId);
  const [projectId, setProjectId] = useState(entry.projectId);
  const [startedAt, setStartedAt] = useState(entry.startedAt.slice(0, 16));
  const [stoppedAt, setStoppedAt] = useState(entry.stoppedAt?.slice(0, 16) ?? "");
  const [error, setError] = useState("");
  const isRunning = !entry.stoppedAt;

  const filteredProjects = projects.filter(p => p.clientId === clientId);

  const handleSave = async () => {
    if (!task.trim()) {
      setError("Task name is required.");
      return;
    }
    if (!isRunning && stoppedAt <= startedAt) {
      setError("End time must be after start time.");
      return;
    }
    await onSave({
      id: entry.id, task, clientId, projectId,
      startedAt: new Date(startedAt).toISOString(),
      stoppedAt: isRunning ? "" : new Date(stoppedAt).toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 w-80 font-mono flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white text-sm font-bold tracking-wider">EDIT ENTRY</h3>
        <input value={task} onChange={e => setTask(e.target.value)}
          className="bg-zinc-800 border border-zinc-600 text-white text-sm rounded px-2 py-1 outline-none" />
        <select value={clientId ?? ""} onChange={e => { setClientId(e.target.value ? Number(e.target.value) : undefined); setProjectId(undefined); }}
          className="bg-zinc-800 border border-zinc-600 text-white text-sm rounded px-2 py-1">
          <option value="">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={projectId ?? ""} onChange={e => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-zinc-800 border border-zinc-600 text-white text-sm rounded px-2 py-1" disabled={!clientId}>
          <option value="">No project</option>
          {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="datetime-local" value={startedAt} onChange={e => setStartedAt(e.target.value)}
          className="bg-zinc-800 border border-zinc-600 text-white text-sm rounded px-2 py-1" />
        {!isRunning && (
          <input type="datetime-local" value={stoppedAt} onChange={e => setStoppedAt(e.target.value)}
            className="bg-zinc-800 border border-zinc-600 text-white text-sm rounded px-2 py-1" />
        )}
        {isRunning && <div className="text-xs text-zinc-500">Timer is running — stop time set on Ctrl+K stop.</div>}
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="text-xs text-zinc-500 hover:text-white px-3 py-1">Cancel</button>
          <button onClick={handleSave} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded">Save</button>
        </div>
      </div>
    </div>
  );
}
