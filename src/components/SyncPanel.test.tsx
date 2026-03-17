import { render, screen } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, expect, beforeEach } from "vitest";
import { SyncPanel } from "./SyncPanel";

beforeEach(() => {
  vi.clearAllMocks();
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(false);
});

it("shows Connect buttons when not connected", async () => {
  render(<SyncPanel />);
  const connectBtns = await screen.findAllByText("Connect");
  expect(connectBtns).toHaveLength(2);
});

it("shows Disconnect when google is connected", async () => {
  (invoke as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce(true)  // google_sync_status
    .mockResolvedValueOnce(false); // outlook_sync_status
  render(<SyncPanel />);
  await screen.findByText("Disconnect");
  expect(screen.getByText("Connect")).toBeInTheDocument();
});
