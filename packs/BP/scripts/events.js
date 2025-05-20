import { system, world } from "@minecraft/server";
import { hubMenu } from "./hub_menu";
import { jobMenuBlockBreakHandler, jobMenuFishingHandler, jobMenuInterval, jobMenuKillHandler, jobMenuSetup } from "./essentials/jobMenu/main";
import { moneySetup } from "./essentials/money";
world.afterEvents.worldLoad.subscribe(() => {
    moneySetup();
});
world.afterEvents.playerSpawn.subscribe(({ player }) => {
    jobMenuSetup(player);
});
world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
    hubMenu(player, itemStack);
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
        jobMenuInterval(player);
    });
});
