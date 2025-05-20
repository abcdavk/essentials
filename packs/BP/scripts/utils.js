export function calculateNextValue(level, initial, step) {
    if (level < 1)
        return initial;
    return parseFloat((initial + level * step).toFixed(2));
}
export function itemTypeIdToName(itemtype) {
    const rawName = itemtype.split(":")[1] || itemtype;
    return rawName
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
