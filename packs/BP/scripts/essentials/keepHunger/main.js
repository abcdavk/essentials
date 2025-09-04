import { EntityComponentTypes } from "@minecraft/server";
export function beforeDieHunger(player) {
    const hungerComp = player.getComponent(EntityComponentTypes.Hunger);
    console.warn(hungerComp?.currentValue);
}
