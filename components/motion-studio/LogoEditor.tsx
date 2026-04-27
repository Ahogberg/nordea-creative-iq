"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Moveable from "react-moveable";
import type { LogoConfig, VideoConfig, ElementTransform } from "@/lib/remotion/types";
import { FORMAT_PRESETS } from "@/lib/remotion/styles";

interface LogoEditorProps {
  // The preview container the overlay is positioned against (the rendered Remotion Player).
  previewRef: React.RefObject<HTMLElement | null>;
  format: VideoConfig["format"];
  logo?: LogoConfig;
  onChange: (transform: ElementTransform) => void;
}

/**
 * Transparent overlay sitting on top of the Remotion Player that lets the user
 * drag / resize / rotate the logo. Converts pixel coordinates back into
 * normalized (0-1) transforms for the VideoConfig.
 */
export const LogoEditor: React.FC<LogoEditorProps> = ({
  previewRef,
  format,
  logo,
  onChange,
}) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const moveableRef = useRef<Moveable | null>(null);
  const [bounds, setBounds] = useState<{ width: number; height: number } | null>(null);

  const preset = FORMAT_PRESETS[format] || FORMAT_PRESETS.story;

  // Track the preview element's rendered size so we can translate between
  // pixel space (editor) and canvas space (0-1 fractions).
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setBounds({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewRef]);

  // Apply current logo transform to the DOM target so Moveable positions
  // its handles around it.
  useEffect(() => {
    if (!targetRef.current || !bounds) return;

    const t = logo?.transform;
    const xFrac = t?.x ?? 0.5;
    const yFrac = t?.y ?? 0.05;
    const scale = t?.scale ?? 1;
    const rotation = t?.rotation ?? 0;

    // Logo natural width = 15% of canvas width, rendered at current preview scale.
    const logoWidthPx = bounds.width * 0.15 * scale;

    const cx = bounds.width * xFrac;
    const cy = bounds.height * yFrac;

    const el = targetRef.current;
    el.style.width = `${logoWidthPx}px`;
    // Keep height auto-derived from aspect ratio via the underlying <img>.
    el.style.left = `${cx - logoWidthPx / 2}px`;
    el.style.top = `${cy}px`;
    el.style.transform = `translateY(-50%) rotate(${rotation}deg)`;

    // Ask Moveable to recompute handle positions after style change
    requestAnimationFrame(() => {
      moveableRef.current?.updateRect();
    });
  }, [logo, bounds, preset]);

  const commitTransform = useCallback(
    (partial: Partial<ElementTransform>) => {
      if (!bounds) return;
      const el = targetRef.current;
      if (!el) return;

      const current = logo?.transform ?? { x: 0.5, y: 0.05, scale: 1 };
      const next: ElementTransform = {
        x: current.x,
        y: current.y,
        scale: current.scale,
        rotation: current.rotation ?? 0,
        ...partial,
      };
      onChange(next);
    },
    [bounds, logo?.transform, onChange]
  );

  if (!logo?.url || !bounds) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
    >
      {/* Invisible target that Moveable attaches handles to */}
      <div
        ref={targetRef}
        className="absolute pointer-events-auto"
        style={{
          boxSizing: "border-box",
        }}
      />

      <Moveable
        ref={moveableRef}
        target={targetRef}
        draggable
        resizable
        rotatable
        keepRatio
        throttleDrag={0}
        throttleResize={0}
        throttleRotate={0}
        origin={false}
        onDrag={({ target, left, top }) => {
          // Moveable reports target's top-left in container-relative px.
          // Convert to center-of-element fractions.
          const el = target as HTMLElement;
          const widthPx = el.offsetWidth;
          const heightPx = el.offsetHeight;
          const cx = left + widthPx / 2;
          const cy = top + heightPx / 2;
          el.style.left = `${left}px`;
          el.style.top = `${top}px`;
          // Keep rotation that was set on the element (transform is translateY(-50%) rotate; rewrite)
          const rotation = logo.transform?.rotation ?? 0;
          el.style.transform = `rotate(${rotation}deg)`;
          commitTransform({
            x: Math.max(0, Math.min(1, cx / bounds.width)),
            y: Math.max(0, Math.min(1, cy / bounds.height)),
          });
        }}
        onResize={({ target, width, drag }) => {
          const el = target as HTMLElement;
          el.style.width = `${width}px`;
          if (drag) {
            el.style.left = `${drag.left}px`;
            el.style.top = `${drag.top}px`;
          }
          const baseWidth = bounds.width * 0.15;
          const newScale = width / baseWidth;
          const cx = (drag?.left ?? parseFloat(el.style.left)) + width / 2;
          const cy = (drag?.top ?? parseFloat(el.style.top)) + el.offsetHeight / 2;
          commitTransform({
            scale: Math.max(0.2, Math.min(4, newScale)),
            x: Math.max(0, Math.min(1, cx / bounds.width)),
            y: Math.max(0, Math.min(1, cy / bounds.height)),
          });
        }}
        onRotate={({ target, beforeRotate }) => {
          (target as HTMLElement).style.transform = `rotate(${beforeRotate}deg)`;
          commitTransform({ rotation: beforeRotate });
        }}
        renderDirections={["nw", "ne", "sw", "se"]}
      />
    </div>
  );
};
