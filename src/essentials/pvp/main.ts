import { Entity, Player, system, world } from "@minecraft/server";

export function antiFleeMain(attacker: Entity, target: Player) {
  const attackerTypes = [
    "minecraft:arrow",
    "minecraft:player"
  ];
  if (attackerTypes.includes(attacker.typeId)) {
    target.setDynamicProperty("anti_flee:timer", 20 * 5);
    attacker.setDynamicProperty("anti_flee:timer", 20 * 5);
  }
}

export function antiFleeTimer() {
  world.getPlayers().forEach(player => {
    let timer = player.getDynamicProperty("anti_flee:timer") as number;
    if (timer === undefined) return;
    timer --

    player.setDynamicProperty("anti_flee:timer", timer);

    if (timer <= 0) {
      player.setDynamicProperty("anti_flee:timer", undefined);
    }
  });
}