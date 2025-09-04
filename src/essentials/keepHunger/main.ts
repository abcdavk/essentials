import { EntityComponentTypes, Player } from "@minecraft/server";

export function beforeDieHunger(player: Player) {
  const hungerComp = player.getComponent(EntityComponentTypes.Hunger);
  console.warn(hungerComp?.currentValue);
}