import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/bunker/AppShell";
import { HeroScene } from "@/components/bunker/HeroScene";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <HeroScene />
    </AppShell>
  );
}
