import { Vector3 } from "@minecraft/server";
import { custom_id_texture } from "./essentials/config";
import { typeIdToID } from "./libs/typeIds";

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

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function generateRandomID(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

export function truncateWithDots(text: string, maxLength: number = 12): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

const number_of_1_16_100_items = 2;

export function convertTypeIdToAuxIcon(typeId: string, enchanted: boolean = false): string {
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

export function getRadius1(pos: Vector3): Vector3[] {
  const result: Vector3[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        // Skip center block if not needed
        if (dx === 0 && dy === 0 && dz === 0) continue;

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
