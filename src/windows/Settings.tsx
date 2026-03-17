import { useState } from "react";
import { ClientManager } from "../components/ClientManager";
import { ProjectManager } from "../components/ProjectManager";

export function Settings() {
  const [clientsKey, setClientsKey] = useState(0);

  return (
    <div className="p-4 font-mono flex flex-col gap-6 max-w-lg">
      <ClientManager onMutation={() => setClientsKey(k => k + 1)} />
      <ProjectManager key={clientsKey} />
      <div>
        <h3 className="text-xs tracking-wider text-zinc-400 uppercase mb-2">Hotkey</h3>
        <div className="text-sm text-zinc-400">Global shortcut: <span className="text-white">Ctrl+K</span></div>
      </div>
      <div>
        <h3 className="text-xs tracking-wider text-zinc-400 uppercase mb-2">Theme</h3>
        <div className="text-sm text-zinc-400">Dark mode active.</div>
      </div>
    </div>
  );
}
