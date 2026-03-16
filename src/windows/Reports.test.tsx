import { render, screen } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, expect, beforeEach } from "vitest";
import { Reports } from "./Reports";

beforeEach(() => {
  vi.clearAllMocks();
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

it("renders range buttons", async () => {
  render(<Reports />);
  expect(screen.getByText("day")).toBeInTheDocument();
  expect(screen.getByText("week")).toBeInTheDocument();
  expect(screen.getByText("month")).toBeInTheDocument();
  expect(screen.getByText("custom")).toBeInTheDocument();
});

it("renders export button", async () => {
  render(<Reports />);
  expect(screen.getByText(/export csv/i)).toBeInTheDocument();
});

it("shows empty state when no entries", async () => {
  render(<Reports />);
  await screen.findByText(/no completed entries/i);
});
