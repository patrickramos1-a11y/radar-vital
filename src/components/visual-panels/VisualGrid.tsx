import React from "react";

interface VisualGridProps {
  children: React.ReactNode;
  itemCount: number;
}

function getGridColumns(count: number): number {
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  if (count <= 16) return 4;
  if (count <= 25) return 5;
  if (count <= 36) return 6;
  return 7;
}

export function VisualGrid({ children, itemCount }: VisualGridProps) {
  const columns = getGridColumns(itemCount);

  return (
    <div className="flex-1 overflow-auto p-3">
      <div
        className="grid gap-3 auto-rows-fr"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
