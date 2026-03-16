import { useState, useEffect, useCallback } from "react";
import { commands } from "../lib/tauri";
import type { Entry, StopEntryInput, UpdateEntryInput } from "../lib/types";

export function useEntries(from?: string, to?: string) {
  const [entries, setEntries] = useState<Entry[]>([]);

  const refresh = useCallback(async () => {
    setEntries(await commands.listEntries(from, to));
  }, [from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    entries,
    refresh,
    stopEntry: async (input: StopEntryInput) => {
      await commands.stopEntry(input);
      await refresh();
    },
    updateEntry: async (input: UpdateEntryInput) => {
      await commands.updateEntry(input);
      await refresh();
    },
    deleteEntry: async (id: number) => {
      await commands.deleteEntry(id);
      await refresh();
    },
  };
}
