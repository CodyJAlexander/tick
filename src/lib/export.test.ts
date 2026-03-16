import { generateCsv } from "./export";
import { it, expect } from "vitest";

it("generates CSV with correct headers", () => {
  const csv = generateCsv([], [], []);
  expect(csv).toContain("Date,Client,Project,Task,Start,End,Duration (hrs)");
});

it("generates correct row for an entry", () => {
  const entry = {
    id: 1, task: "fix nav bug", clientId: 1, projectId: 1,
    startedAt: "2026-03-16T09:00:00.000Z",
    stoppedAt: "2026-03-16T10:30:00.000Z",
    syncPending: false, createdAt: "", googleEventId: undefined, outlookEventId: undefined,
  };
  const clients = [{ id: 1, name: "Acme", color: "#ff0000" }];
  const projects = [{ id: 1, name: "Website", clientId: 1 }];
  const csv = generateCsv([entry], clients, projects);
  expect(csv).toContain("Acme");
  expect(csv).toContain("Website");
  expect(csv).toContain("fix nav bug");
  expect(csv).toContain("1.50"); // 1.5 hours
});
