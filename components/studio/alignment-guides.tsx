"use client";

export interface GuideLine {
  axis: "horizontal" | "vertical";
  position: number; // 0-1 along the canvas
}

interface Props {
  guides: GuideLine[];
}

export function AlignmentGuides({ guides }: Props) {
  if (guides.length === 0) return null;
  return (
    <>
      {guides.map((g, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            ...(g.axis === "vertical"
              ? {
                  left: `${g.position * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: "1px",
                }
              : {
                  top: `${g.position * 100}%`,
                  left: 0,
                  right: 0,
                  height: "1px",
                }),
            background: "#40BFA3",
            boxShadow: "0 0 4px rgba(64, 191, 163, 0.6)",
          }}
        />
      ))}
    </>
  );
}
