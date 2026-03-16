// src/windows/MainWindow.tsx
import { useState } from "react";
import { Timeline } from "./Timeline";
import { Reports } from "./Reports";
import { Settings } from "./Settings";

type Tab = "timeline" | "reports" | "settings";

export function MainWindow() {
  const [tab, setTab] = useState<Tab>("timeline");

  return (
    <div className="h-screen bg-zinc-950 text-white font-mono flex flex-col">
      <nav className="flex border-b border-zinc-800 px-4">
        {(["timeline", "reports", "settings"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs tracking-wider uppercase transition-colors ${
              tab === t ? "text-white border-b-2 border-indigo-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto">
        {tab === "timeline" && <Timeline />}
        {tab === "reports" && <Reports />}
        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}
