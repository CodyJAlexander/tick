import { render, screen, fireEvent } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, expect, beforeEach } from "vitest";
import { ProjectManager } from "./ProjectManager";

beforeEach(() => {
  vi.clearAllMocks();
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

it("renders empty state", async () => {
  render(<ProjectManager />);
  await screen.findByText(/no projects/i);
});

it("shows error when delete fails", async () => {
  (invoke as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce([{ id: 1, name: "Website", clientId: undefined }]) // list_projects
    .mockResolvedValueOnce([]) // list_clients
    .mockRejectedValueOnce(new Error("This project has 2 entries."));
  render(<ProjectManager />);
  await screen.findByText("Website");
  fireEvent.click(screen.getByRole("button", { name: /delete project/i }));
  await screen.findByText(/entries/i);
});
