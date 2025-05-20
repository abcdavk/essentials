export function calculateNextValue(level, initial, step) {
    if (level < 1)
        return initial;
    return parseFloat((initial + level * step).toFixed(2));
}
