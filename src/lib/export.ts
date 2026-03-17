import type { Entry, Client, Project } from "./types";

export function generateCsv(entries: Entry[], clients: Client[], projects: Project[]): string {
  const header = "Date,Client,Project,Task,Start,End,Duration (hrs)";
  const rows = entries
    .filter(e => e.stoppedAt)
    .map(e => {
      const client = clients.find(c => c.id === e.clientId);
      const project = projects.find(p => p.id === e.projectId);
      const start = new Date(e.startedAt);
      const end = new Date(e.stoppedAt!);
      const durationHrs = ((end.getTime() - start.getTime()) / 3600000).toFixed(2);
      const date = start.toISOString().slice(0, 10);
      const fmt = (s: string) => `"${s.replace(/"/g, '""')}"`;
      return [
        date,
        fmt(client?.name ?? ""),
        fmt(project?.name ?? ""),
        fmt(e.task),
        start.toLocaleTimeString(),
        end.toLocaleTimeString(),
        durationHrs,
      ].join(",");
    });
  return [header, ...rows].join("\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
