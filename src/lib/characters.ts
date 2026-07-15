import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSheetCharacters, type SheetCharacter } from "@/lib/sheets.functions";
import { getPlayerProfile } from "@/lib/player";

export function useSheetCharacters() {
  const fetchFn = useServerFn(getSheetCharacters);
  return useQuery({
    queryKey: ["sheet_characters"],
    queryFn: fetchFn,
    staleTime: 5 * 60_000,
  });
}

export function pickCharacter(
  list: SheetCharacter[] | undefined,
  characterId: string | null | undefined,
): SheetCharacter | null {
  if (!list || list.length === 0) return null;
  if (!characterId) return null;
  const norm = String(characterId).trim().toLowerCase();
  return (
    list.find((c) => c.id.trim().toLowerCase() === norm) ?? null
  );
}

export function useCurrentCharacter(): SheetCharacter | null {
  const { data } = useSheetCharacters();
  const profile = getPlayerProfile();
  return pickCharacter(data, profile.characterId);
}
