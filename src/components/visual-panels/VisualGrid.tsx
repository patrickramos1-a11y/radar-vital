import { ReactNode, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VisualGridProps {
  children: ReactNode;
  itemCount: number;
}

export function VisualGrid({ children, itemCount }: VisualGridProps) {
  // Calculate optimal grid columns based on item count
  const columns = useMemo(() => {
    if (itemCount <= 6) return 3;
    if (itemCount <= 12) return 4;
    if (itemCount <= 20) return 5;
    if (itemCount <= 35) return 6;
    return 7;
  }, [itemCount]);

  const gap = itemCount > 20 ? "gap-3" : "gap-4";

  return (
    <ScrollArea className="flex-1">
      <div 
        className={`grid p-6 ${gap}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(200px, 1fr))`,
        }}
      >
        {children}
      </div>
    </ScrollArea>
  );
}
