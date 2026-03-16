import { invoke } from "@tauri-apps/api/core";
import type {
  Entry,
  Client,
  Project,
  StopEntryInput,
  UpdateEntryInput,
} from "./types";

export const commands = {
  createEntry: (task: string, startedAt: string) =>
    invoke<number>("create_entry", { task, startedAt }),
  stopEntry: (input: StopEntryInput) =>
    invoke<void>("stop_entry", { input }),
  updateEntry: (input: UpdateEntryInput) =>
    invoke<void>("update_entry", { input }),
  deleteEntry: (id: number) =>
    invoke<void>("delete_entry", { id }),
  listEntries: (from?: string, to?: string) =>
    invoke<Entry[]>("list_entries", { from, to }),
  getRunningEntry: () =>
    invoke<Entry | null>("get_running_entry"),

  createClient: (name: string, color: string) =>
    invoke<number>("create_client", { name, color }),
  listClients: () => invoke<Client[]>("list_clients"),
  updateClient: (id: number, name: string, color: string) =>
    invoke<void>("update_client", { id, name, color }),
  deleteClient: (id: number) => invoke<void>("delete_client", { id }),

  createProject: (name: string, clientId?: number) =>
    invoke<number>("create_project", { name, clientId }),
  listProjects: () => invoke<Project[]>("list_projects"),
  updateProject: (id: number, name: string, clientId?: number) =>
    invoke<void>("update_project", { id, name, clientId }),
  deleteProject: (id: number) => invoke<void>("delete_project", { id }),
};
