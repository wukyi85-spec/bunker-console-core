import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  initSound,
  isMuted,
  playSound,
  startAmbient,
  subscribeSound,
  toggleMuted,
} from "@/lib/sound";
import { cn } from "@/lib/utils";

/**
 * Global sound + fullscreen orchestrator.
 * - Boots the audio context on the first user gesture.
 * - Attaches delegated click/hover SFX to any element with data-sfx.
 * - Handles double-tap-to-toggle fullscreen anywhere on screen.
 * - Renders a small mute toggle in the top-right corner.
 */
export function SoundProvider() {
  const [muted, setMutedState] = useState(true);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    initSound();
    setMutedState(isMuted());
    const unsub = subscribeSound(() => setMutedState(isMuted()));
    return () => {
      unsub();
    };
  }, []);

  // Boot audio on first user gesture, then start ambient loop.
  useEffect(() => {
    if (booted) return;
    const boot = () => {
      setBooted(true);
      if (!isMuted()) {
        playSound("terminalBoot");
        setTimeout(() => startAmbient(), 400);
      }
      window.removeEventListener("pointerdown", boot);
      window.removeEventListener("keydown", boot);
    };
    window.addEventListener("pointerdown", boot, { once: true });
    window.addEventListener("keydown", boot, { once: true });
    return () => {
      window.removeEventListener("pointerdown", boot);
      window.removeEventListener("keydown", boot);
    };
  }, [booted]);

  // Restart ambient when unmuted after boot
  useEffect(() => {
    if (!booted) return;
    if (!muted) startAmbient();
  }, [muted, booted]);

  // Delegated UI SFX — any interactive element plays click; data-sfx overrides.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>("[data-sfx],button,a,[role='button'],input[type='checkbox']");
      if (!el) return;
      const kind = el.dataset.sfx || "click";
      if (kind === "none") return;
      playSound(kind as Parameters<typeof playSound>[0]);
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>("button,a,[role='button'],[data-sfx-hover]");
      if (!el) return;
      // Skip if just moved from a child of the same element
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related && el.contains(related)) return;
      playSound("hover");
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onOver, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onOver, true);
    };
  }, []);

  // Double-tap anywhere → toggle fullscreen.
  useEffect(() => {
    let last = 0;
    let lastX = 0;
    let lastY = 0;

    const onPointer = async (e: PointerEvent) => {
      // Ignore taps on inputs, textareas, and elements that opted out.
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable ||
          target.closest("[data-no-fs]")
        )
          return;
      }
      const now = Date.now();
      const dx = Math.abs(e.clientX - lastX);
      const dy = Math.abs(e.clientY - lastY);
      if (now - last < 320 && dx < 40 && dy < 40) {
        last = 0;
        await toggleFullscreen();
        return;
      }
      last = now;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  return (
    <button
      type="button"
      data-no-fs
      data-sfx="none"
      aria-label={muted ? "Unmute" : "Mute"}
      onClick={(e) => {
        e.stopPropagation();
        toggleMuted();
      }}
      className={cn(
        "fixed right-3 top-3 z-[110] flex h-8 w-8 items-center justify-center",
        "rounded-full border border-white/15 bg-black/70 backdrop-blur-md",
        "text-white/70 shadow-lg transition-all hover:border-neon/50 hover:text-neon",
        "lphone:h-7 lphone:w-7",
      )}
    >
      {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
    </button>
  );
}

async function toggleFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
  };
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  };
  try {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      else if (doc.msExitFullscreen) await doc.msExitFullscreen();
    } else {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    }
  } catch {
    /* silently ignore */
  }
}
