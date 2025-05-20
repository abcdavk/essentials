
export function calculateNextValue(level: number, initial: number, step: number): number {
    if (level < 1) return initial;
    return parseFloat((initial + level * step).toFixed(2));
}