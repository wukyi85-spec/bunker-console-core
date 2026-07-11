import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  to?: "/dashboard";
}

/**
 * Premium game-style back button. Sits under the logo on internal pages.
 */
export function BackToBunker({ className, to = "/dashboard" }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full",
        "border border-white/10 bg-black/50 backdrop-blur-md",
        "px-3.5 py-1.5 text-[11px] font-display font-bold uppercase tracking-[0.28em]",
        "text-white/70 hover:text-white",
        "transition-all duration-300",
        "hover:border-white/25 hover:bg-black/70",
        "hover:shadow-[0_6px_24px_-8px_rgb(0_0_0/0.8)]",
        "active:scale-[0.97]",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span>Back to Bunker</span>
    </Link>
  );
}
