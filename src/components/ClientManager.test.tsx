import { render, screen, fireEvent } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, expect, beforeEach } from "vitest";
import { ClientManager } from "./ClientManager";

beforeEach(() => {
  vi.clearAllMocks();
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

it("renders empty state", async () => {
  render(<ClientManager />);
  await screen.findByText(/no clients/i);
});

it("shows error when delete fails", async () => {
  (invoke as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce([{ id: 1, name: "Acme", color: "#ff0000" }])
    .mockRejectedValueOnce(new Error("This client has 3 entries."));
  render(<ClientManager />);
  await screen.findByText("Acme");
  fireEvent.click(screen.getByRole("button", { name: /delete/i }));
  await screen.findByText(/entries/i);
});
