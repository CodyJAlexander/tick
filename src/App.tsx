// src/App.tsx
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { StartPopup } from "./popup/StartPopup";
import { StopPopup } from "./popup/StopPopup";
import { MainWindow } from "./windows/MainWindow";
import { commands } from "./lib/tauri";
import { useClients } from "./hooks/useClients";
import { useProjects } from "./hooks/useProjects";
import type { Entry } from "./lib/types";

export default function App() {
  const label = getCurrentWindow().label;
  const [popupMode, setPopupMode] = useState<"start" | "stop">("start");
  const [runningEntry, setRunningEntry] = useState<Entry | null>(null);
  const { clients } = useClients();
  const { projects } = useProjects();

  useEffect(() => {
    if (label !== "popup") return;
    const unlisten = listen<string>("popup-mode", async (e) => {
      if (e.payload === "stop") {
        const entry = await commands.getRunningEntry();
        setRunningEntry(entry);
      }
      setPopupMode(e.payload as "start" | "stop");
    });
    return () => { unlisten.then(fn => fn()); };
  }, [label]);

  if (label === "popup") {
    if (popupMode === "stop" && runningEntry) {
      return <StopPopup entry={runningEntry} clients={clients} projects={projects} />;
    }
    return <StartPopup />;
  }

  return <MainWindow />;
}
