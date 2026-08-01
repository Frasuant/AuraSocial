export const POST_CATEGORIES = [
  { value: "goal", label: "Goal", emoji: "🎯", color: "from-emerald-500 to-teal-500" },
  { value: "car", label: "Car Flex", emoji: "🚗", color: "from-rose-500 to-orange-500" },
  { value: "earnings", label: "Earnings", emoji: "💰", color: "from-amber-500 to-yellow-500" },
  { value: "watch", label: "Watch Flex", emoji: "⌚", color: "from-sky-500 to-cyan-500" },
  { value: "travel", label: "Travel", emoji: "✈️", color: "from-violet-500 to-fuchsia-500" },
  { value: "fitness", label: "Fitness", emoji: "💪", color: "from-lime-500 to-green-500" },
  { value: "business", label: "Business", emoji: "📈", color: "from-indigo-500 to-purple-500" },
  { value: "flex", label: "General Flex", emoji: "🔥", color: "from-pink-500 to-rose-500" },
] as const;

export const AVATAR_COLORS = [
  "violet",
  "rose",
  "amber",
  "emerald",
  "sky",
  "fuchsia",
  "orange",
  "teal",
] as const;

export function categoryMeta(value: string) {
  return POST_CATEGORIES.find((c) => c.value === value) ?? POST_CATEGORIES[POST_CATEGORIES.length - 1];
}
