import { Block, Dimension, Entity, EntityComponentTypes, Player, system, Vector3, world } from "@minecraft/server";
import { handleBreakProtectionBlock, handleInteractProtectionBlock, handlePlaceProtectionBlock } from "./protection_block";
import { AllowList, ExpiredDate, ProtectionData } from "../../interfaces";
import { ActionFormData } from "@minecraft/server-ui";
import { Expired, Protection } from "./classes";





// ================Begin-Initialization================

world.afterEvents.playerSpawn.subscribe(({
  player
}) => {
  console.log("spawning ", player.nameTag);
  if (world.getDynamicProperty("lc:protection_data") === undefined) {
    world.setDynamicProperty("lc:protection_data", JSON.stringify([]));
    world.setDynamicProperty("lc:expired", JSON.stringify([]));
  };
  new Expired().update(player);
});

// ================End-Initialization================

function getPlayerProtectionData(player: Player, origin: Block | Entity) {
  const { dimension } = origin;
  const protectionBlocks = dimension.getEntities({ type: "lc:protection_block" });

  for (const protection of protectionBlocks) {
    const protectionBlock = dimension.getBlock(protection.location);
    if (!protectionBlock) continue;

    const protectionData = new Protection().get(protectionBlock);
    if (!protectionData) continue;

    const { x: cx, z: cz } = protection.location;
    const { x: px, z: pz } = origin.location;
    const half = protectionData.protectionSize / 2;

    const isInside =
      px >= cx - half && px < cx + half &&
      pz >= cz - half && pz < cz + half;

    if (!isInside) continue;

    const isOwner = protectionData.nameTag === player.nameTag;
    const allowList = protectionData.allowList ?? [];

    const matchedFriend = allowList.find(friend => friend.nameTag === player.nameTag);

    const defaultPermission: AllowList = {
      nameTag: player.nameTag,
      allow_place_block: false,
      allow_break_block: false,
      allow_interact_with_block: false,
      allow_tnt: false,
      allow_button: false,
      allow_lever: false,
      allow_interact_armor_stand: false,
      allow_attack_animals: false,
      allow_attack_players: false
    };

    return {
      isOwner,
      isFriend: !!matchedFriend,
      allowList: matchedFriend ?? defaultPermission
    };
  }

  return {
    isOwner: true,
    isFriend: true,
    allowList: {
      nameTag: "",
      allow_place_block: true,
      allow_break_block: true,
      allow_interact_with_block: true,
      allow_tnt: true,
      allow_button: true,
      allow_lever: true,
      allow_interact_armor_stand: true,
      allow_attack_animals: true,
      allow_attack_players: true
    } as AllowList
  };
}

const playerCooldowns = new Map<string, number>();

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const { player, block, permutationBeingPlaced } = data;
  const isProtectionBlock = permutationBeingPlaced.type.id.includes("lc:protection_block");

  const { isOwner, allowList } = getPlayerProtectionData(player, block);
  if (!isOwner && !allowList.allow_place_block) {
    data.cancel = true;
    return;
  }

  // If player placing protection block
  const expiredLength = new Expired().getPlayerExpiredLength(player);
  console.log(expiredLength)
  if (isProtectionBlock) {
    if (expiredLength <= 10) {
      system.run(() => handlePlaceProtectionBlock(data));
    } else {
      data.cancel = true;
      player.sendMessage('§cMax block protection reached!')
    }
  }
});


world.beforeEvents.playerBreakBlock.subscribe((data) => {
  let { player, block } = data;
  let isProtectionBlock = block.typeId.includes("lc:protection_block")
  
  const { isOwner, allowList } = getPlayerProtectionData(player, block);
  if (!isOwner && !allowList.allow_break_block) {
    data.cancel = true;
    return;
  }

  if (isProtectionBlock) {
    console.log("Breaking protection block");
    system.run(() => handleBreakProtectionBlock(data));
  }
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  let { block, player, itemStack } = data;
  
  const { isOwner, allowList } = getPlayerProtectionData(player, block);
  if (!isOwner) {
    const id = block.typeId.toLowerCase();

    const permissionChecks: { keywords: string[]; permission: keyof AllowList }[] = [
      { keywords: ["button"], permission: "allow_button" },
      { keywords: ["tnt"], permission: "allow_tnt" },
      { keywords: ["lever"], permission: "allow_lever" },
    ];

    let matched = false;

    for (const check of permissionChecks) {
      if (check.keywords.some(keyword => id.includes(keyword))) {
        matched = true;
        if (!allowList[check.permission]) {
          data.cancel = true;
          return;
        }
      }
    }

    if (!matched) {
      const generalInteractKeywords = [
        "craft", "table", "anvil", "stand", "grind", "furnace", "smoker",
        "chest", "barrel", "sign", "frame", "beacon", "dropper",
        "dispenser", "hopper", "loom"
      ];
      if (generalInteractKeywords.some(keyword => id.includes(keyword))) {
        if (!allowList.allow_interact_with_block) {
          data.cancel = true;
          return;
        }
      }
    }
  }

  const now = Date.now();
  const lastUsed = playerCooldowns.get(player.nameTag) ?? 0;
  if (now - lastUsed < 260) return;

  playerCooldowns.set(player.nameTag, now);
  let isProtectionBlock = block.typeId.includes("lc:protection_block");
  if (isProtectionBlock) {
    system.run(() => handleInteractProtectionBlock(data));
  }
});

world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
  let { player, target } = data;
  const { isOwner, allowList } = getPlayerProtectionData(player, target);
  if (!isOwner && target.typeId === "minecraft:armor_stand" && !allowList.allow_interact_with_block) {
    data.cancel = true;
    return;
  }
});

world.beforeEvents.explosion.subscribe((data) => {
  let { source: explosionEntity, dimension } = data;
  if (!explosionEntity) return;
  const protectionEntities = dimension.getEntities({ type: "lc:protection_block" });

  for (const protectionEntity of protectionEntities) {
    const protectionBlock = dimension.getBlock(protectionEntity.location);
    if (!protectionBlock) continue;

    const protectionData = new Protection().get(protectionBlock);
    if (!protectionData) continue;

    const { x: cx, z: cz } = protectionEntity.location;
    const { x: px, z: pz } = explosionEntity.location;
    const half = protectionData.protectionSize / 2;

    const isInside =
      px >= cx - half && px < cx + half &&
      pz >= cz - half && pz < cz + half;
      
    if (!isInside) continue;
    if (explosionEntity.typeId === "minecraft:tnt" && protectionData.settings.anti_tnt) {
      data.cancel = true;
    }
    if (explosionEntity.typeId === "minecraft:creeper" && protectionData.settings.anti_creeper) {
      data.cancel = true;
    }
  }
});

// ==========detect entity in area==========
system.runInterval(() => {
  const allPlayers = world.getPlayers();

  allPlayers.forEach(player => {
    const dimension = player.dimension;
    const protectionEntities = dimension.getEntities({ type: "lc:protection_block" });

    for (const protectionEntity of protectionEntities) {
      const protectionBlock = dimension.getBlock(protectionEntity.location);
      if (!protectionBlock) continue;

      const protectionData = new Protection().get(protectionBlock);
      if (!protectionData) continue;
      dimension.getEntities().forEach(entity => {
        const { x: cx, z: cz } = protectionEntity.location;
        const { x: px, z: pz } = entity.location;
        const half = protectionData.protectionSize / 2;
  
        const isInside =
          px >= cx - half && px < cx + half &&
          pz >= cz - half && pz < cz + half;
          
        if (isInside) {
          if (entity.typeId === "minecraft:splash_potion" && protectionData.settings.anti_splash_potion) {
            entity.remove();
          }
          if (entity.typeId === "minecraft:arrow" && protectionData.settings.anti_arrow) {
            entity.remove();
          }
          if (entity.getComponent(EntityComponentTypes.TypeFamily)?.hasTypeFamily("monster") && protectionData.settings.anti_hostile) {
            entity.remove();
          }
        }
      })
    }
  });
});

// ==========detect player in area==========
system.runInterval(() => {
  const allPlayers = world.getPlayers();

  allPlayers.forEach(player => {
    const dimension = player.dimension;
    const protectionEntities = dimension.getEntities({ type: "lc:protection_block" });

    let isInProtectedArea = false;
    let isOwner = false;
    let allowAttackPlayers = true;
    let allowAttackAnimals = true;
    let antiHostile = false

    for (const protectionEntity of protectionEntities) {
      const protectionBlock = dimension.getBlock(protectionEntity.location);
      if (!protectionBlock) continue;

      const protectionData = new Protection().get(protectionBlock);
      if (!protectionData) continue;

      const { x: cx, z: cz } = protectionEntity.location;
      const { x: px, z: pz } = player.location;
      const half = protectionData.protectionSize / 2;

      const isInside =
        px >= cx - half && px < cx + half &&
        pz >= cz - half && pz < cz + half;
        
      if (!isInside) continue;
      
      isOwner = protectionData.nameTag === player.nameTag;
      
      isInProtectedArea = true;

      allowAttackPlayers = protectionData.allowList.find(f => f.nameTag === player.nameTag)?.allow_attack_players ?? false;
      allowAttackAnimals = protectionData.allowList.find(f => f.nameTag === player.nameTag)?.allow_attack_animals ?? false;
      antiHostile = protectionData.settings.anti_hostile ?? false;
      break;
    }


    if (isInProtectedArea) {
      if (!isOwner) {
        if (!allowAttackPlayers && !player.hasTag("deny_attack_player")) {
          player.addTag("deny_attack_player");
        }
        if (!allowAttackAnimals && !player.hasTag("deny_attack_animals")) {
          player.addTag("deny_attack_animals");
        }
      }
      // if (antiHostile) {
      //   console.log("event triggered")
      //   player.triggerEvent("dave:add_anti_hostile");
      // }
    } else {
      if (player.hasTag("deny_attack_player")) {
        player.removeTag("deny_attack_player");
      }
      if (player.hasTag("deny_attack_animals")) {
        player.removeTag("deny_attack_animals");
      }
      // if (!antiHostile) {
      //   player.triggerEvent("dave:remove_anti_hostile")
      // }
    }
  });
});

// ==========show boundaries========
system.runInterval(() => {
  world.getPlayers().forEach(player => {
    const dimension = world.getDimension(player.dimension.id);
    dimension.getEntities({ type: "lc:protection_block" }).forEach(protectionEntity => {
      const block = dimension.getBlock(protectionEntity.location);

      if (block === undefined) return;
      const protectionData = new Protection().get(block);
      const expiredData = new Expired();
      const isExpired = expiredData.isExpired(block);
      if (isExpired) {
        block.setType("minecraft:air");
        protectionEntity.remove();
        new Protection().remove(block);
        expiredData.remove(block)
      }
      if (protectionData === undefined) return;
      if (!protectionData.settings.showBoundaries) return;
      const loc = protectionEntity.location;


      const radius = protectionData.protectionSize / 2;
      if (radius !== undefined) {
        const step = 2;
        const y = loc.y;
        const delay = 1;

        const delayedSpawn = (x: number, y: number, z: number, delayTicks: number) => {
          system.runTimeout(() => {
            try {
              dimension.spawnParticle("lc:selection_draw", { x, y, z });
            } catch (err) {
              
            }
          }, delayTicks);
        }

        let tickCounter = 0;

        for (let x = loc.x - radius; x <= loc.x + radius; x += step) {
          delayedSpawn(x, y, loc.z - radius, tickCounter++);
          delayedSpawn(x, y, loc.z + radius, tickCounter++);
        }
      
        for (let z = loc.z - radius; z <= loc.z + radius; z += step) {
          delayedSpawn(loc.x - radius, y, z, tickCounter++);
          delayedSpawn(loc.x + radius, y, z, tickCounter++);
        }
      }
    });
  });
}, 20);



system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === "lc:setting") {
    if (ev.message === "reset") {
      world.setDynamicProperty("lc:protection_data", JSON.stringify([]));
      world.setDynamicProperty("lc:expired", JSON.stringify([]));
    }
    if (ev.message === "get") {
      const data = world.getDynamicProperty("lc:protection_data") as string;
      const exp = world.getDynamicProperty("lc:expired") as string;
      console.log(data);
      console.log(exp);
    }
  }
  if (ev.id === "claim:tp") {
    let message = ev.message;
    let player = ev.sourceEntity as Player;
    if (player?.typeId !== "minecraft:player") return;
    if (message !== "") {
      let rawData = new Protection().getAll();
      if (rawData !== undefined) {
        let form = new ActionFormData()
          .title("§f§0§1§r§l§0TP to Claim Land")
          .body(`Owner: §b${rawData[0].nameTag}`)
        for (let i = 0; i < rawData.length; i++) {
          let { x, y, z } = rawData[i].location;
          form.button(`§r${rawData[i].settings.plotName}\n ${x}, ${y}, ${z}`);
        }
        form.show(player).then(res => {
          if (res.selection !== undefined) {
            let loc = rawData[res.selection].location;
            let plotName = rawData[res.selection].settings.plotName;
            let { x, y, z } = loc

            player.teleport(loc);
            player.sendMessage(`Teleported to ${plotName}.\nOwner: ${rawData[0].nameTag}\nLocation: §a${x}, ${y}, ${z}`)
          }
        });
      }
    } else {
      handleShowAllPlayers(player)
    }
  }
});

function handleShowAllPlayers(player: Player) {
  let rawData = new Protection().getAll();
  let form = new ActionFormData()
   .title("§f§0§1§r§l§0All Players")
  for (let i = 0; i < rawData.length; i++) {
    let { x, y, z } = rawData[i].location;
    form.button(`§r${rawData[i].nameTag}\n ${x}, ${y}, ${z}`);
  }
  form.show(player).then(res => {
    if (res.selection !== undefined) {
      let loc = rawData[res.selection].location;
      let plotName = rawData[res.selection].settings.plotName;
      let { x, y, z } = loc

      player.teleport(loc);
      player.sendMessage(`Teleported to ${plotName}.\nOwner: ${rawData[0].nameTag}\nLocation: §a${x}, ${y}, ${z}`)
    }
  });
}