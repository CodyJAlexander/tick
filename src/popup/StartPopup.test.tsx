import { render, screen, fireEvent } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { vi, it, expect, beforeEach } from "vitest";
import { StartPopup } from "./StartPopup";

beforeEach(() => vi.clearAllMocks());

it("renders task input auto-focused", () => {
  render(<StartPopup />);
  const input = screen.getByPlaceholderText("what are you working on?");
  expect(input).toBeInTheDocument();
});

it("Enter with text calls create_entry and closes popup", async () => {
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(1);
  const onClose = vi.fn();
  render(<StartPopup onClose={onClose} />);
  const input = screen.getByPlaceholderText("what are you working on?");
  fireEvent.change(input, { target: { value: "fix nav bug" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await new Promise(r => setTimeout(r, 0));
  expect(invoke).toHaveBeenCalledWith("create_entry", expect.objectContaining({ task: "fix nav bug" }));
  expect(onClose).toHaveBeenCalled();
});

it("Escape closes popup without calling invoke", () => {
  const onClose = vi.fn();
  render(<StartPopup onClose={onClose} />);
  const input = screen.getByPlaceholderText("what are you working on?");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(invoke).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});
