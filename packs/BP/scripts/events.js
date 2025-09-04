import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, EntityComponentTypes, EquipmentSlot, system, world } from "@minecraft/server";
import { hubMenu, hubMenuSetup, PVP_OFF_ICON, PVP_ON_ICON } from "./hub_menu";
import { jobMenuBlockBreakHandler, jobMenuFishingHandler, jobMenuInterval, jobMenuKillHandler, jobMenuSetup } from "./essentials/jobMenu/main";
import { moneySetup } from "./essentials/money";
import { adminMenu } from "./essentials/adminMenu/main";
import { playerTitleSetup, titleOnChat, titleSetup } from "./essentials/title/main";
import { auctionHouseInterval, auctionHousePlayerSetup } from "./essentials/auctionHouse/main";
import { teleportPlayerSetup, teleportSetup } from "./essentials/teleports/main";
import { claimedAreaOnlyBlocks, claimedAreaOnlyItems } from "./essentials/landClaim/config";
import { adminAddPrivilage, adminMenuInit, adminMenuMainUI } from "./essentials/adminMenu/form_ui";
import { limitSpawnEntity } from "./essentials/entitySpawnLimit/main";
import { antiFleeMain, antiFleeTimer } from "./essentials/pvp/main";
import { bountyBoardPlayerSetup } from "./essentials/bounty/main";
import { getActualName } from "./utils";
import { beforeDieHunger } from "./essentials/keepHunger/main";
world.afterEvents.worldLoad.subscribe(() => {
    moneySetup();
    titleSetup();
    teleportSetup();
});
world.beforeEvents.chatSend.subscribe((data) => {
    titleOnChat(data);
});
world.beforeEvents.playerPlaceBlock.subscribe((event) => {
    const { permutationToPlace, player } = event;
    const bannedBlocks = [
        "minecraft:slime",
        "minecraft:honey_block"
    ];
    if (bannedBlocks.includes(permutationToPlace.type.id) && player.commandPermissionLevel < CommandPermissionLevel.Admin) {
        event.cancel = true;
    }
});
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    playerTitleSetup(player);
    jobMenuSetup(player);
    auctionHousePlayerSetup(player);
    hubMenuSetup(player);
    teleportPlayerSetup(player);
    bountyBoardPlayerSetup(player);
    player.nameTag = `${getActualName(player.nameTag)}§r${player.hasTag("pvp_enabled") ? PVP_ON_ICON : PVP_OFF_ICON}`;
});
// world.beforeEvents.playerLeave.subscribe(({ player }) => {
// });
world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
    hubMenu(player, itemStack);
    adminMenu(player, itemStack);
});
world.afterEvents.playerBreakBlock.subscribe(({ brokenBlockPermutation, player }) => {
    jobMenuBlockBreakHandler(player, brokenBlockPermutation);
});
world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    jobMenuFishingHandler(entity);
    limitSpawnEntity(entity);
});
world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    jobMenuKillHandler(damageSource, deadEntity);
    if (deadEntity.typeId === "minecraft:player")
        beforeDieHunger(deadEntity);
});
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    if (hitEntity.typeId === "minecraft:player")
        antiFleeMain(damagingEntity, hitEntity);
});
system.runInterval(() => {
    world.getPlayers().forEach(player => {
        const dimension = player.dimension;
        jobMenuInterval(player);
    });
    auctionHouseInterval();
    antiFleeTimer();
});
// Custom command registry
system.beforeEvents.startup.subscribe(({ customCommandRegistry: ccr }) => {
    ccr.registerEnum("ess:debug_enum", ["getAllClaimAreaOnlyBlocks", "getAllClaimAreaOnlyItems", "adminMenu", "getTypeId", "togglePrivilege", "spawnEntity", "removeEntity"]);
    ccr.registerCommand({
        name: "ess:debug",
        description: "Essentials debug tools for dev.",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
            { name: "ess:debug_enum", type: CustomCommandParamType.Enum }
        ],
        optionalParameters: [
            { name: "arg1", type: CustomCommandParamType.String },
            { name: "arg2", type: CustomCommandParamType.Integer }
        ]
    }, (({ sourceEntity: player }, debug_enum, arg1, arg2) => {
        const equip = player?.getComponent(EntityComponentTypes.Equippable);
        if (debug_enum === "getAllClaimAreaOnlyBlocks") {
            for (let i = 0; i < claimedAreaOnlyBlocks.length; i++) {
                system.run(() => player?.runCommand(`give @s ${claimedAreaOnlyBlocks[i]}`));
            }
        }
        if (debug_enum === "getAllClaimAreaOnlyItems") {
            for (let i = 0; i < claimedAreaOnlyItems.length; i++) {
                system.run(() => player?.runCommand(`give @s ${claimedAreaOnlyItems[i]}`));
            }
        }
        if (debug_enum === "getTypeId") {
            const itemHand = equip?.getEquipment(EquipmentSlot.Mainhand);
            player.sendMessage(`${itemHand?.typeId}`);
        }
        if (debug_enum === "adminMenu") {
            system.run(() => adminMenuMainUI(player));
        }
        if (debug_enum === "togglePrivilege") {
            system.run(() => adminAddPrivilage(player));
        }
        if (debug_enum === "spawnEntity") {
            system.run(() => {
                for (let i = 0; i < arg2; i++) {
                    player?.dimension.spawnEntity(arg1, player.location);
                }
            });
        }
        if (debug_enum === "removeEntity") {
            const allEntities = player?.dimension.getEntities() ?? [];
            system.run(() => {
                for (let i = 0; i < allEntities.length; i++) {
                    if (allEntities[i].typeId !== "minecraft:player") {
                        allEntities[i].remove();
                    }
                    ;
                }
            });
        }
        return { status: CustomCommandStatus.Success, message: "Done." };
    }));
    ccr.registerCommand({
        name: "ess:init",
        description: "Initialize Essentials database.",
        permissionLevel: CommandPermissionLevel.Admin,
    }, (({ sourceEntity: player }) => {
        adminMenuInit(player);
        return { status: CustomCommandStatus.Success, message: "Done." };
    }));
});
