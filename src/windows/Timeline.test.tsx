import { render, screen } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, beforeEach } from "vitest";
import { Timeline } from "./Timeline";

const mockEntry = {
  id: 1, task: "fix nav bug", clientId: 1, projectId: undefined,
  startedAt: new Date().toISOString(),
  stoppedAt: new Date(Date.now() + 3600000).toISOString(),
  syncPending: false, createdAt: "", googleEventId: undefined, outlookEventId: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue([mockEntry]);
});

it("renders today's total in header", async () => {
  render(<Timeline />);
  await screen.findByText(/today/i);
});

it("renders a time block for each entry", async () => {
  render(<Timeline />);
  await screen.findByText("fix nav bug");
});
