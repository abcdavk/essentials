import { custom_id_texture } from "./essentials/config";
import { typeIdToID } from "./libs/typeIds";
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
export function getActualName(playerNameTag) {
    return playerNameTag.split("§r")[0];
}
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export function generateRandomID(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}
export function truncateWithDots(text, maxLength = 12) {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
/**
 * n = how many new items added
 * x = 2 + n
 */
const number_of_1_16_100_items = 2; // x
export function convertTypeIdToAuxIcon(typeId, enchanted = false) {
    const ID = typeIdToID.get(typeId);
    if (ID !== undefined) {
        let finalID = ((ID + (ID < 256 ? 0 : number_of_1_16_100_items)) * 65536);
        finalID = enchanted ? finalID + 32768 : finalID;
        return `§aaux_item§a${finalID}`;
    }
    const texturePath = custom_id_texture[typeId];
    if (texturePath) {
        return texturePath;
    }
    return 'textures/unknown';
}
export function getRadius1(pos) {
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                // Skip center block if not needed
                if (dx === 0 && dy === 0 && dz === 0)
                    continue;
                result.push({
                    x: pos.x + dx,
                    y: pos.y + dy,
                    z: pos.z + dz
                });
            }
        }
    }
    return result;
}
