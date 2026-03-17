import { useState } from "react";
import { useClients } from "../hooks/useClients";

interface Props {
  onMutation?: () => void;
}

export function ClientManager({ onMutation }: Props) {
  const { clients, createClient, deleteClient } = useClients();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createClient(newName.trim(), newColor);
    setNewName("");
    setNewColor("#6366f1");
    onMutation?.();
  };

  const handleDelete = async (id: number) => {
    try {
      setError("");
      await deleteClient(id);
      onMutation?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs tracking-wider text-zinc-400 uppercase">Clients</h3>
      {clients.length === 0 && <div className="text-zinc-600 text-sm">No clients yet.</div>}
      {clients.map(c => (
        <div key={c.id} className="flex items-center gap-2 border border-zinc-800 rounded px-3 py-2">
          <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
          <span className="flex-1 text-sm text-white">{c.name}</span>
          <button onClick={() => handleDelete(c.id)} className="text-xs text-zinc-500 hover:text-red-400" aria-label="delete">Delete</button>
        </div>
      ))}
      {error && <div className="text-red-400 text-xs">{error}</div>}
      <div className="flex gap-2 items-center mt-1">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Client name"
          className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-2 py-1 outline-none" />
        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
        <button onClick={handleCreate} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded">Add</button>
      </div>
    </div>
  );
}
