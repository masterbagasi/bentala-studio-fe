export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function aspectRatioClass(ratio: string): string {
  const map: Record<string, string> = {
    "16:9": "aspect-[16/9]",
    "4:5": "aspect-[4/5]",
    "1:1": "aspect-square",
    "4:3": "aspect-[4/3]",
    "3:4": "aspect-[3/4]",
  };
  return map[ratio] ?? "aspect-[4/3]";
}
