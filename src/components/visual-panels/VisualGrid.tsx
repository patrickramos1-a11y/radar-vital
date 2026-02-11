import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VisualGridProps {
  children: ReactNode;
  itemCount: number;
}

export function VisualGrid({ children, itemCount }: VisualGridProps) {
  const gap = itemCount > 20 ? "gap-3" : "gap-4";

  return (
    <ScrollArea className="flex-1">
      <div 
        className={`grid p-6 ${gap} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}
        style={{
          gridTemplateColumns: undefined,
        }}
      >
        {children}
      </div>
    </ScrollArea>
  );
}
