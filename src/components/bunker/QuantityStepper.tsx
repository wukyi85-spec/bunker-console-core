import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (delta: number) => void;
  min?: number;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, className }: Props) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-sm border border-border/60 bg-background/60 p-1", className)}>
      <button
        type="button"
        onClick={() => value > min && onChange(-1)}
        disabled={value <= min}
        className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-panel-elevated hover:text-neon disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-[2ch] text-center font-mono text-sm font-bold text-foreground">
        {value.toString().padStart(2, "0")}
      </span>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-panel-elevated hover:text-neon"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
