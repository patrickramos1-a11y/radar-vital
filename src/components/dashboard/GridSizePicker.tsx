import { useState, useCallback } from "react";
import { Grid3X3, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface GridSizePickerProps {
  selectedSize: { cols: number; rows: number } | null;
  onSizeSelect: (size: { cols: number; rows: number } | null) => void;
}

const MAX_COLS = 12;
const MAX_ROWS = 10;

export function GridSizePicker({ selectedSize, onSizeSelect }: GridSizePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredSize, setHoveredSize] = useState<{ cols: number; rows: number } | null>(null);

  const handleCellHover = useCallback((cols: number, rows: number) => {
    setHoveredSize({ cols, rows });
  }, []);

  const handleCellClick = useCallback((cols: number, rows: number) => {
    onSizeSelect({ cols, rows });
    setIsOpen(false);
    setHoveredSize(null);
  }, [onSizeSelect]);

  const handleClearSelection = useCallback(() => {
    onSizeSelect(null);
    setIsOpen(false);
  }, [onSizeSelect]);

  const displaySize = hoveredSize || selectedSize;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${
                selectedSize 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              {selectedSize && (
                <span className="text-[10px] font-bold">
                  {selectedSize.cols}×{selectedSize.rows}
                </span>
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {selectedSize 
            ? `Grid fixo: ${selectedSize.cols}×${selectedSize.rows}` 
            : 'Escolher tamanho do grid'}
        </TooltipContent>
      </Tooltip>

      <PopoverContent 
        className="w-auto p-3" 
        align="end"
        onMouseLeave={() => setHoveredSize(null)}
      >
        <div className="flex flex-col gap-2">
          {/* Header with size display */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Escolher Grid
            </span>
            <span className="text-sm font-bold text-primary">
              {displaySize ? `${displaySize.cols} × ${displaySize.rows}` : '—'}
            </span>
          </div>

          {/* Grid of cells */}
          <div 
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
          >
            {Array.from({ length: MAX_ROWS }).map((_, rowIndex) => (
              Array.from({ length: MAX_COLS }).map((_, colIndex) => {
                const col = colIndex + 1;
                const row = rowIndex + 1;
                const isHighlighted = hoveredSize 
                  ? col <= hoveredSize.cols && row <= hoveredSize.rows
                  : selectedSize 
                    ? col <= selectedSize.cols && row <= selectedSize.rows
                    : false;

                return (
                  <button
                    key={`${col}-${row}`}
                    className={`w-4 h-4 border rounded-sm transition-colors ${
                      isHighlighted
                        ? 'bg-primary border-primary'
                        : 'bg-muted/30 border-border hover:border-primary/50'
                    }`}
                    onMouseEnter={() => handleCellHover(col, row)}
                    onClick={() => handleCellClick(col, row)}
                  />
                );
              })
            ))}
          </div>

          {/* Clear button */}
          {selectedSize && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs gap-1"
              onClick={handleClearSelection}
            >
              <X className="w-3 h-3" />
              Limpar seleção
            </Button>
          )}

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
            <span className="w-full text-[10px] text-muted-foreground mb-0.5">Presets:</span>
            {[
              { cols: 5, rows: 5 },
              { cols: 7, rows: 5 },
              { cols: 7, rows: 7 },
              { cols: 8, rows: 6 },
              { cols: 10, rows: 5 },
              { cols: 10, rows: 8 },
            ].map((preset) => (
              <button
                key={`${preset.cols}x${preset.rows}`}
                onClick={() => handleCellClick(preset.cols, preset.rows)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded border transition-colors ${
                  selectedSize?.cols === preset.cols && selectedSize?.rows === preset.rows
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 border-border hover:bg-muted'
                }`}
              >
                {preset.cols}×{preset.rows}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
