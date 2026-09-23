"use client";

// Delad uppspelning i Motion Studio: scenen äger spelaren, transportraden och
// scenkorten läser aktuell bildruta och kan spela, pausa och söka.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";

export const STUDIO_FPS = 30;

interface PlayerControls {
  /** Ref-callback till <MotionPlayer playerRef>. */
  attach: (player: PlayerRef | null) => void;
  frame: number;
  playing: boolean;
  toggle: () => void;
  pause: () => void;
  seekToSeconds: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerControls | null>(null);

export function StudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerRef | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  // Förhandsvisningen monteras om efter ändringar — behåll position och
  // paus så att man kan justera keyframes utan att tappa var man är.
  const last = useRef({ frame: 0, playing: true });
  useEffect(() => {
    last.current = { frame, playing };
  }, [frame, playing]);

  useEffect(() => {
    if (!player) return;
    const { frame: resumeAt, playing: wasPlaying } = last.current;
    if (resumeAt > 0) player.seekTo(resumeAt);
    if (!wasPlaying) player.pause();
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("seeked", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("seeked", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [player]);

  const attach = useCallback((p: PlayerRef | null) => setPlayer(p), []);
  const toggle = useCallback(() => player?.toggle(), [player]);
  const pause = useCallback(() => player?.pause(), [player]);
  const seekToSeconds = useCallback(
    (seconds: number) => player?.seekTo(Math.max(0, Math.round(seconds * STUDIO_FPS))),
    [player]
  );

  const value = useMemo(
    () => ({ attach, frame, playing, toggle, pause, seekToSeconds }),
    [attach, frame, playing, toggle, pause, seekToSeconds]
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function useStudioPlayer(): PlayerControls {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("useStudioPlayer måste användas inom StudioPlayerProvider");
  return ctx;
}
