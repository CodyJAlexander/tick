import { renderHook, act } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { useClients } from "./useClients";
import { vi, expect, it, beforeEach } from "vitest";

beforeEach(() => vi.clearAllMocks());

it("loads clients on mount", async () => {
  (invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
    { id: 1, name: "Acme", color: "#ff0000" },
  ]);
  const { result } = renderHook(() => useClients());
  await act(async () => {});
  expect(result.current.clients).toHaveLength(1);
  expect(result.current.clients[0].name).toBe("Acme");
});

it("createClient calls invoke and refreshes list", async () => {
  (invoke as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce([])          // initial load
    .mockResolvedValueOnce(1)           // createClient returns id
    .mockResolvedValueOnce([{ id: 1, name: "Acme", color: "#ff0000" }]); // refresh
  const { result } = renderHook(() => useClients());
  await act(async () => {});
  await act(async () => { await result.current.createClient("Acme", "#ff0000"); });
  expect(result.current.clients).toHaveLength(1);
});
