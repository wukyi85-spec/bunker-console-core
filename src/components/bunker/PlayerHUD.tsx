import { Shield, Zap } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

export function PlayerHUD() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-11 w-11 rounded-md border border-neon/50 bg-panel-elevated flex items-center justify-center overflow-hidden">
          <span className="font-display text-lg font-bold text-neon">B</span>
        </div>
        <span className="absolute -bottom-1 -right-1 rounded-sm border border-background bg-neon px-1 py-0 font-mono text-[9px] font-bold text-background">
          07
        </span>
      </div>
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
            OPERATOR
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">ID · 4B12</span>
        </div>
        <ProgressBar value={64} label={undefined} showValue={false} />
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-neon" /> 100
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-neon" /> LVL 07
          </span>
        </div>
      </div>
    </div>
  );
}
