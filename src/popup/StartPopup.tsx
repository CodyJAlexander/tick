// src/popup/StartPopup.tsx
import { useRef, useEffect } from "react";
import { commands } from "../lib/tauri";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface Props { onClose?: () => void; }

export function StartPopup({ onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const close = () => {
    onClose?.();
    getCurrentWindow().hide();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Enter") {
      const task = inputRef.current?.value.trim();
      if (!task) return;
      await commands.createEntry(task, new Date().toISOString());
      close();
    }
  };

  return (
    <div className="h-screen bg-zinc-900 flex flex-col justify-center p-4">
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        placeholder="what are you working on?"
        className="bg-transparent border-b border-zinc-600 text-white font-mono text-sm outline-none py-1 w-full placeholder-zinc-500"
      />
      <div className="mt-2 text-xs text-zinc-600 font-mono">↵ start &nbsp; esc cancel</div>
    </div>
  );
}
