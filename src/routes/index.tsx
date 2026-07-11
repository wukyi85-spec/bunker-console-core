import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoadingScreen } from "@/components/bunker/LoadingScreen";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  return <LoadingScreen onComplete={() => navigate({ to: "/login" })} />;
}
