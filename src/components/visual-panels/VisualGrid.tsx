import React from "react";

interface VisualGridProps {
  children: React.ReactNode;
  itemCount: number;
}

function getGridColumns(count: number): number {
  if (count <= 4) return 2;
  if (count <= 8) return 3;
  return 4;
}

export function VisualGrid({ children, itemCount }: VisualGridProps) {
  const columns = getGridColumns(itemCount);

  return (
    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
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
