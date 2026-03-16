import "@testing-library/jest-dom";

// Mock Tauri invoke globally in tests
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
  TauriEvent: {},
}));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => ({
    label: "main",
    hide: vi.fn(() => Promise.resolve()),
    show: vi.fn(() => Promise.resolve()),
  })),
}));
