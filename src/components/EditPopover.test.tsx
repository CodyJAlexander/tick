import { render, screen, fireEvent } from "@testing-library/react";
import { vi, it, expect, beforeEach } from "vitest";
import { EditPopover } from "./EditPopover";

const entry = {
  id: 1, task: "fix nav bug", clientId: undefined, projectId: undefined,
  startedAt: "2026-03-16T09:00:00.000Z",
  stoppedAt: "2026-03-16T10:00:00.000Z",
  syncPending: false, createdAt: "", googleEventId: undefined, outlookEventId: undefined,
};

beforeEach(() => vi.clearAllMocks());

it("renders task field with current value", () => {
  const onSave = vi.fn();
  render(<EditPopover entry={entry} clients={[]} projects={[]} onSave={onSave} onClose={vi.fn()} />);
  expect(screen.getByDisplayValue("fix nav bug")).toBeInTheDocument();
});

it("shows validation error when end is before start", async () => {
  const onSave = vi.fn();
  const invalidEntry = { ...entry, stoppedAt: "2026-03-16T08:00:00.000Z" }; // before startedAt
  render(<EditPopover entry={invalidEntry} clients={[]} projects={[]} onSave={onSave} onClose={vi.fn()} />);
  const saveBtn = screen.getByText("Save");
  fireEvent.click(saveBtn);
  await new Promise(r => setTimeout(r, 0));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText("End time must be after start time.")).toBeInTheDocument();
});
