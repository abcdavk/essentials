import { system, world } from "@minecraft/server";
import { hubMenu } from "./hub_menu";
import { jobMenuBlockBreakHandler, jobMenuFishingHandler, jobMenuInterval, jobMenuKillHandler, jobMenuSetup } from "./essentials/jobMenu/main";
import { moneySetup } from "./essentials/money";
import { adminMenuInterval, adminMenu } from "./essentials/adminMenu/main";
import { titleSetup } from "./essentials/title/main";
world.afterEvents.worldLoad.subscribe(() => {
    moneySetup();
    titleSetup();
});
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    jobMenuSetup(player);
});
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
        adminMenuInterval(dimension);
    });
});
