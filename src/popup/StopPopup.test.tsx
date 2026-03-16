import { render, screen, fireEvent } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, expect, beforeEach } from "vitest";
import { StopPopup } from "./StopPopup";

const mockEntry = {
  id: 1, task: "fix nav bug", clientId: undefined, projectId: undefined,
  startedAt: new Date(Date.now() - 60000).toISOString(),
  stoppedAt: undefined, syncPending: false, createdAt: "",
  googleEventId: undefined, outlookEventId: undefined,
};

beforeEach(() => vi.clearAllMocks());

it("renders elapsed time and task name", () => {
  render(<StopPopup entry={mockEntry} clients={[]} projects={[]} />);
  expect(screen.getByDisplayValue("fix nav bug")).toBeInTheDocument();
});

it("Enter saves the entry", async () => {
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<StopPopup entry={mockEntry} clients={[]} projects={[]} onClose={onClose} />);
  fireEvent.keyDown(document, { key: "Enter" });
  await new Promise(r => setTimeout(r, 0));
  expect(invoke).toHaveBeenCalledWith("stop_entry", expect.anything());
  expect(onClose).toHaveBeenCalled();
});

it("Discard button calls delete_entry and closes", async () => {
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<StopPopup entry={mockEntry} clients={[]} projects={[]} onClose={onClose} />);
  fireEvent.click(screen.getByText(/discard/i));
  await new Promise(r => setTimeout(r, 0));
  expect(invoke).toHaveBeenCalledWith("delete_entry", expect.anything());
  expect(onClose).toHaveBeenCalled();
});
