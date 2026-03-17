import { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import { useClients } from "../hooks/useClients";

export function ProjectManager() {
  const { projects, createProject, deleteProject } = useProjects();
  const { clients } = useClients();
  const [newName, setNewName] = useState("");
  const [newClientId, setNewClientId] = useState<number | undefined>();
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createProject(newName.trim(), newClientId);
    setNewName("");
  };

  const handleDelete = async (id: number) => {
    try {
      setError("");
      await deleteProject(id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs tracking-wider text-zinc-400 uppercase">Projects</h3>
      {projects.length === 0 && <div className="text-zinc-600 text-sm">No projects yet.</div>}
      {projects.map(p => {
        const client = clients.find(c => c.id === p.clientId);
        return (
          <div key={p.id} className="flex items-center gap-2 border border-zinc-800 rounded px-3 py-2">
            <span className="flex-1 text-sm text-white">{p.name}</span>
            {client && <span className="text-xs text-zinc-500">{client.name}</span>}
            <button onClick={() => handleDelete(p.id)} className="text-xs text-zinc-500 hover:text-red-400" aria-label="delete project">Delete</button>
          </div>
        );
      })}
      {error && <div className="text-red-400 text-xs">{error}</div>}
      <div className="flex gap-2 items-center mt-1">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Project name"
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-2 py-1 outline-none" />
        <select value={newClientId ?? ""} onChange={e => setNewClientId(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1">
          <option value="">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleCreate} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded">Add</button>
      </div>
    </div>
  );
}
