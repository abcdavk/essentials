import { world } from "@minecraft/server";
const spawnRadius = 15;
const maxEntities = 75;
export function limitSpawnEntity(entity) {
    const dimension = entity.dimension;
    const entityLoc = entity.location;
    for (const player of world.getPlayers()) {
        const playerLoc = player.location;
        const dx = playerLoc.x - entityLoc.x;
        const dy = playerLoc.y - entityLoc.y;
        const dz = playerLoc.z - entityLoc.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance <= spawnRadius) {
            const nearbyEntities = dimension.getEntities({
                location: entityLoc,
                maxDistance: spawnRadius
            });
            if (nearbyEntities.length >= maxEntities) {
                entity.remove();
                console.warn(`Removed ${entity.typeId}, too many entities nearby`);
            }
            break;
        }
    }
}
