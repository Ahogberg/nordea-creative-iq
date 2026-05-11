"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import type { Scene, MotionConfig } from "@/lib/remotion/types";

interface ChatAction {
  type:
    | "update_scene"
    | "update_motion"
    | "add_scene"
    | "remove_scene";
  scene_index?: number;
  updates?: Partial<Scene>;
  motion?: MotionConfig;
  scene?: Scene;
}

export function ChatInput() {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const config = useStudioStore((s) => s.config);
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const updateScene = useStudioStore((s) => s.updateScene);
  const updateMotion = useStudioStore((s) => s.updateMotion);
  const addScene = useStudioStore((s) => s.addScene);
  const removeScene = useStudioStore((s) => s.removeScene);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setExplanation(null);
    const userMessage = message.trim();
    setMessage("");

    try {
      const res = await fetch("/api/studio/chat-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          config,
          selected_scene_index: selectedSceneIndex,
        }),
      });

      if (!res.ok) throw new Error("Chat-AI svarade med fel");
      const data = (await res.json()) as {
        actions?: ChatAction[];
        explanation?: string;
      };

      for (const action of data.actions ?? []) {
        switch (action.type) {
          case "update_scene":
            if (
              typeof action.scene_index === "number" &&
              action.updates
            ) {
              updateScene(action.scene_index, action.updates);
            }
            break;
          case "update_motion":
            if (action.motion) {
              updateMotion(action.motion);
            }
            break;
          case "add_scene":
            if (action.scene) {
              addScene(action.scene);
            }
            break;
          case "remove_scene":
            if (typeof action.scene_index === "number") {
              removeScene(action.scene_index);
            }
            break;
        }
      }

      setExplanation(data.explanation ?? "Klar");
      setTimeout(() => setExplanation(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-6 py-3 bg-white border-t border-nordea-hairline flex-shrink-0">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder='Beskriv ändringar… t.ex. "Gör hela videon mer energisk" eller "Byt rubriken till en fråga"'
            rows={1}
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-2.5 bg-nordea-bg border border-nordea-border rounded-xl text-sm text-nordea-text placeholder:text-nordea-text-tertiary focus:outline-none focus:border-nordea-blue/40 focus:ring-2 focus:ring-nordea-blue/10 resize-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            className="absolute right-2 bottom-2 w-8 h-8 bg-nordea-teal hover:bg-nordea-teal-hover text-nordea-deep rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors"
            title="Skicka (Enter)"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="text-xs text-center mt-1.5 h-4">
        {error && (
          <span className="text-nordea-rose inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </span>
        )}
        {!error && explanation && (
          <span className="text-nordea-teal">{explanation}</span>
        )}
        {!error && !explanation && (
          <span className="text-nordea-text-tertiary">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI tolkar din beskrivning och uppdaterar rätt egenskaper
          </span>
        )}
      </div>
    </div>
  );
}
