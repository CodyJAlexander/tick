// src/hooks/useTimer.ts
import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { commands } from "../lib/tauri";
import type { Entry } from "../lib/types";

export function useTimer() {
  const [runningEntry, setRunningEntry] = useState<Entry | null>(null);

  useEffect(() => {
    commands.getRunningEntry().then(entry => setRunningEntry(entry));
    const unlisten = listen<boolean>("timer-changed", e => {
      if (!e.payload) {
        setRunningEntry(null);
      } else {
        commands.getRunningEntry().then(entry => setRunningEntry(entry));
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  return { runningEntry };
}
