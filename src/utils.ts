
export function calculateNextValue(level: number, initial: number, step: number): number {
    if (level < 1) return initial;
    return parseFloat((initial + level * step).toFixed(2));
}

export function itemTypeIdToName(itemtype: string): string {
  const rawName = itemtype.split(":")[1] || itemtype;

  return rawName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
