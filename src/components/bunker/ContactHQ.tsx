import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGameSettings, DEFAULT_SETTINGS } from "@/lib/sheets.functions";

interface ContactHQProps {
  orderId?: string;
  className?: string;
  label?: string;
  compact?: boolean;
}

export function ContactHQ({ orderId, className, label = "CONTACT HQ", compact }: ContactHQProps) {
  const fetchSettings = useServerFn(getGameSettings);
  const q = useQuery({ queryKey: ["game_settings"], queryFn: fetchSettings, staleTime: 60_000 });
  const baseUrl = (q.data?.contact_telegram_url || DEFAULT_SETTINGS.contact_telegram_url).trim();

  function open() {
    if (!baseUrl) return;
    let url = baseUrl;
    if (orderId) {
      const msg = encodeURIComponent(`Hello HQ, I need help with Order ${orderId}.`);
      url += (baseUrl.includes("?") ? "&" : "?") + `text=${msg}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Contact HQ on Telegram"
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-sm border border-neon/50 bg-neon/10 font-display font-black uppercase tracking-[0.28em] text-neon transition-all",
        "hover:border-neon hover:bg-neon/20 hover:shadow-[0_0_18px_-4px_var(--neon)] active:scale-[0.98]",
        compact ? "px-2.5 py-1.5 text-[10px]" : "px-3.5 py-2 text-[11px]",
        className,
      )}
    >
      <Send className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{label}</span>
      {orderId && !compact && (
        <span className="ml-1 rounded-sm border border-neon/40 bg-background/40 px-1.5 py-[1px] font-mono text-[9px] tracking-widest text-neon/80">
          #{orderId.slice(0, 8)}
        </span>
      )}
    </button>
  );
}
