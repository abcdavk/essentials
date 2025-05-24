import { system, world } from "@minecraft/server";
import { hubMenu } from "./hub_menu";
import { jobMenuBlockBreakHandler, jobMenuFishingHandler, jobMenuInterval, jobMenuKillHandler, jobMenuSetup } from "./essentials/jobMenu/main";
import { moneySetup } from "./essentials/money";
import { adminMenu } from "./essentials/adminMenu/main";
import { playerTitleSetup, titleOnChat, titleSetup } from "./essentials/title/main";
import { auctionHouseInterval, auctionHousePlayerSetup, auctionHouseSetup } from "./essentials/auctionHouse/main";

world.afterEvents.worldLoad.subscribe(() => {
  moneySetup();
  titleSetup();
});

world.beforeEvents.chatSend.subscribe((data) => {
  titleOnChat(data);
});

world.afterEvents.playerSpawn.subscribe(({
    player
}) => {
  playerTitleSetup(player);
  jobMenuSetup(player);
  auctionHousePlayerSetup(player);
});

// world.beforeEvents.playerLeave.subscribe(({ player }) => {
  
// });

world.afterEvents.itemUse.subscribe(({
  source: player,
  itemStack
}) => {
  hubMenu(player, itemStack);
  adminMenu(player, itemStack);
});

world.afterEvents.playerBreakBlock.subscribe(({
    brokenBlockPermutation,
    player
}) => {
  jobMenuBlockBreakHandler(player, brokenBlockPermutation);
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  jobMenuFishingHandler(entity);
});

world.afterEvents.entityDie.subscribe(({
    damageSource,
    deadEntity
}) => {
  jobMenuKillHandler(damageSource, deadEntity);
});

system.runInterval(() => {
  world.getPlayers().forEach(player => {
    const dimension = player.dimension;
    jobMenuInterval(player);
  });
  auctionHouseInterval();
});