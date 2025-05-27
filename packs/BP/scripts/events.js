import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, EntityComponentTypes, EquipmentSlot, system, world } from "@minecraft/server";
import { hubMenu, hubMenuSetup } from "./hub_menu";
import { jobMenuBlockBreakHandler, jobMenuFishingHandler, jobMenuInterval, jobMenuKillHandler, jobMenuSetup } from "./essentials/jobMenu/main";
import { moneySetup } from "./essentials/money";
import { adminMenu } from "./essentials/adminMenu/main";
import { playerTitleSetup, titleOnChat, titleSetup } from "./essentials/title/main";
import { auctionHouseInterval, auctionHousePlayerSetup } from "./essentials/auctionHouse/main";
import { teleportPlayerSetup, teleportSetup } from "./essentials/teleports/main";
import { claimedAreaOnlyBlocks, claimedAreaOnlyItems } from "./essentials/landClaim/config";
import { adminMenuInit, adminMenuMainUI } from "./essentials/adminMenu/form_ui";
world.afterEvents.worldLoad.subscribe(() => {
    moneySetup();
    titleSetup();
    teleportSetup();
});
world.beforeEvents.chatSend.subscribe((data) => {
    titleOnChat(data);
});
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    playerTitleSetup(player);
    jobMenuSetup(player);
    auctionHousePlayerSetup(player);
    hubMenuSetup(player);
    teleportPlayerSetup(player);
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
});
world.afterEvents.entityDie.subscribe(({ damageSource, deadEntity }) => {
    jobMenuKillHandler(damageSource, deadEntity);
});
system.runInterval(() => {
    world.getPlayers().forEach(player => {
        const dimension = player.dimension;
        jobMenuInterval(player);
    });
    auctionHouseInterval();
});
system.beforeEvents.startup.subscribe(({ customCommandRegistry: ccr }) => {
    ccr.registerEnum("ess:debug_enum", ["getAllClaimAreaOnlyBlocks", "getAllClaimAreaOnlyItems", "adminMenu", "getTypeId"]);
    ccr.registerCommand({
        name: "ess:debug",
        description: "Essentials debug tools for dev.",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [{ name: "ess:debug_enum", type: CustomCommandParamType.Enum }]
    }, (({ sourceEntity: player }, debug_enum) => {
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
