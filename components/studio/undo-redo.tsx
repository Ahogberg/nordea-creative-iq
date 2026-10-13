"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Undo2, Redo2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const noSubscribe = () => () => {};
/** ⌘ på Mac — servern vet inte, så den renderar Ctrl och klienten rättar. */
const useIsMac = () => useSyncExternalStore(noSubscribe, isMac, () => false);

/** I textfält hör Ctrl+Z till texten, inte till videon. */
function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "range", "color", "submit", "reset"].includes(target.type);
  }
  return false;
}

/**
 * Ångra / gör om i toppfältet, plus kortkommandon: Ctrl/⌘+Z ångrar,
 * Ctrl/⌘+Shift+Z och Ctrl+Y gör om.
 */
export function UndoRedo() {
  const canUndo = useStudioStore((s) => s.canUndo);
  const canRedo = useStudioStore((s) => s.canRedo);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const mac = useIsMac();
  const mod = mac ? "⌘" : "Ctrl+";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || isTextField(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const btn =
    "w-8 h-8 rounded-lg flex items-center justify-center text-nordea-text-secondary hover:text-nordea-text hover:bg-nordea-bg-hover transition-colors disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-default";
  return (
    <div className="flex items-center">
      <button type="button" onClick={undo} disabled={!canUndo} aria-label="Ångra" title={`Ångra (${mod}Z)`} className={btn}>
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Gör om"
        title={`Gör om (${mod}${mac ? "⇧Z" : "Y"})`}
        className={btn}
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
}
