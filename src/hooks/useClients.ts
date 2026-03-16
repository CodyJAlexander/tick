import { useState, useEffect, useCallback } from "react";
import { commands } from "../lib/tauri";
import type { Client } from "../lib/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);

  const refresh = useCallback(async () => {
    setClients(await commands.listClients());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createClient = useCallback(
    async (name: string, color: string) => {
      await commands.createClient(name, color);
      await refresh();
    },
    [refresh]
  );

  const updateClient = useCallback(
    async (id: number, name: string, color: string) => {
      await commands.updateClient(id, name, color);
      await refresh();
    },
    [refresh]
  );

  const deleteClient = useCallback(
    async (id: number) => {
      await commands.deleteClient(id);
      await refresh();
    },
    [refresh]
  );

  return { clients, createClient, updateClient, deleteClient };
}
