import { useState, useEffect, useCallback } from "react";
import { commands } from "../lib/tauri";
import type { Project } from "../lib/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  const refresh = useCallback(async () => {
    setProjects(await commands.listProjects());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProject = useCallback(
    async (name: string, clientId?: number) => {
      await commands.createProject(name, clientId);
      await refresh();
    },
    [refresh]
  );

  const updateProject = useCallback(
    async (id: number, name: string, clientId?: number) => {
      await commands.updateProject(id, name, clientId);
      await refresh();
    },
    [refresh]
  );

  const deleteProject = useCallback(
    async (id: number) => {
      await commands.deleteProject(id);
      await refresh();
    },
    [refresh]
  );

  return { projects, createProject, updateProject, deleteProject };
}
