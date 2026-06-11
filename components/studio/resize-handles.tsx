"use client";

interface Props {
  onResizeStart: (e: React.MouseEvent) => void;
}

// 4 corner handles. Each starts a "resize" drag — actual scale math lives
// in CanvasOverlay so all canvas state mutations stay in one place.
export function ResizeHandles({ onResizeStart }: Props) {
  const handles: Array<{
    key: string;
    style: React.CSSProperties;
  }> = [
    {
      key: "tl",
      style: { top: -6, left: -6, cursor: "nwse-resize" },
    },
    {
      key: "tr",
      style: { top: -6, right: -6, cursor: "nesw-resize" },
    },
    {
      key: "bl",
      style: { bottom: -6, left: -6, cursor: "nesw-resize" },
    },
    {
      key: "br",
      style: { bottom: -6, right: -6, cursor: "nwse-resize" },
    },
  ];

  return (
    <>
      {handles.map((h) => (
        <div
          key={h.key}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e);
          }}
          className="absolute w-3 h-3 bg-white rounded-sm pointer-events-auto"
          style={{
            ...h.style,
            border: "2px solid #40BFA3",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      ))}
    </>
  );
}
