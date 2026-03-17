export const VIBE_VALUES = ["aura_up", "real", "mood", "chaotic"] as const;

export type VibeValue = (typeof VIBE_VALUES)[number];

export type VibeMeta = {
  value: VibeValue;
  label: string;
  emoji: string;
  shortLabel: string;
};

export const VIBE_META: VibeMeta[] = [
  { value: "aura_up", label: "Aura Up", emoji: "A+", shortLabel: "Aura" },
  { value: "real", label: "Real", emoji: "100", shortLabel: "Real" },
  { value: "mood", label: "Mood", emoji: "MOOD", shortLabel: "Mood" },
  { value: "chaotic", label: "Chaotic", emoji: "CHAOS", shortLabel: "Chaos" },
];

export const VIBE_LABELS: Record<VibeValue, string> = Object.fromEntries(
  VIBE_META.map((vibe) => [vibe.value, vibe.label]),
) as Record<VibeValue, string>;

export const VIBE_EMOJIS: Record<VibeValue, string> = Object.fromEntries(
  VIBE_META.map((vibe) => [vibe.value, vibe.emoji]),
) as Record<VibeValue, string>;

export const createEmptyVibeCounts = (): Record<VibeValue, number> =>
  Object.fromEntries(VIBE_VALUES.map((value) => [value, 0])) as Record<
    VibeValue,
    number
  >;

export const toUTCDateString = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 10);

export const getUTCDayBounds = (date: Date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

  return {
    dayStartIso: dayStart.toISOString(),
    dayEndIso: dayEnd.toISOString(),
  };
};

export const getUTCDateOffset = (
  baseDate: Date = new Date(),
  offsetDays: number,
): Date => {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();
  return new Date(Date.UTC(year, month, day + offsetDays, 12, 0, 0, 0));
};

