import { EntityComponentTypes, system } from "@minecraft/server";
import { calculateNextValue } from "../../utils";
import { allJobs, fishingLoots } from "./config";
import { Money } from "../money";
export function jobMenuSetup(player) {
    if (!player.hasTag("job:setup")) {
        player.addTag("job:setup");
        new Money().init(player.nameTag);
        player.setDynamicProperty("job:currentJob");
        allJobs.forEach(job => {
            player.removeTag("job:hasEmployed");
            player.setDynamicProperty(`job:${job.title}_level`, 0);
            player.setDynamicProperty(`job:${job.title}_progress`, 0);
        });
    }
}
let lastHookLocation = null;
let moneyAddMessage = "";
export function jobMenuInterval(player) {
    let playerMoney = new Money().get(player.nameTag);
    let playerJob = player.getDynamicProperty("job:currentJob");
    if (playerJob !== undefined) {
        let { initialRequirement, requirementStep, } = allJobs[playerJob];
        let jobTitle = allJobs[playerJob].title;
        let jobLevel = player.getDynamicProperty(`job:${jobTitle}_level`);
        let jobProgress = player.getDynamicProperty(`job:${jobTitle}_progress`);
        let jobRequirement = calculateNextValue(jobLevel, initialRequirement, requirementStep);
        if (jobProgress >= jobRequirement) {
            console.warn(jobProgress);
            player.setDynamicProperty(`job:${jobTitle}_progress`, 0);
            player.setDynamicProperty(`job:${jobTitle}_level`, jobLevel + 1);
        }
        let moneyAdd = player.getDynamicProperty("job:moneyAdd");
        moneyAddMessage = moneyAdd === undefined ? '' : ` §a+$${moneyAdd}`;
        player.onScreenDisplay.setActionBar(`§eMoney: §r$${playerMoney.toFixed(2)}${moneyAddMessage}\n\n§cStatus:\n §vJob: §r${jobTitle}\n §bLevel: §r${jobLevel}\n §uProgress: §r${jobProgress}/${jobRequirement}`);
    }
    else {
        player.onScreenDisplay.setActionBar(`§eMoney: §r$${playerMoney.toFixed(2)}`);
    }
}
export function giveReward(player, reward) {
    let playerJob = player.getDynamicProperty("job:currentJob");
    let playerMoney = new Money().get(player.nameTag);
    let jobTitle = allJobs[playerJob].title;
    let jobProgress = player.getDynamicProperty(`job:${jobTitle}_progress`);
    // player.setDynamicProperty("job:money", parseFloat((playerMoney + reward).toFixed(2)));
    new Money().add(player.nameTag, parseFloat((reward).toFixed(2)));
    player.setDynamicProperty(`job:${jobTitle}_progress`, jobProgress + 1);
    player.setDynamicProperty("job:moneyAdd", reward);
    let messageTimeout = 80;
    let runId = system.runInterval(() => {
        messageTimeout -= 1;
        if (messageTimeout <= 0) {
            player.setDynamicProperty("job:moneyAdd");
            system.clearRun(runId);
        }
    });
    // player.sendMessage(`§aEarned $${reward}`);
}
export function jobMenuFishingHandler(entity) {
    if (entity.typeId === "minecraft:fishing_hook") {
        lastHookLocation = entity.location;
    }
    if (entity.typeId === "minecraft:item") {
        const itemStack = entity.getComponent("minecraft:item")?.itemStack;
        if (!itemStack || !fishingLoots.includes(itemStack.typeId))
            return;
        if (!lastHookLocation)
            return;
        const distance = Math.sqrt(Math.pow(entity.location.x - lastHookLocation.x, 2) +
            Math.pow(entity.location.y - lastHookLocation.y, 2) +
            Math.pow(entity.location.z - lastHookLocation.z, 2));
        if (distance <= 2) {
            const players = entity.dimension.getEntities({
                type: "minecraft:player",
                location: entity.location,
                maxDistance: 8
            });
            const fisher = players.find(player => {
                const inv = player.getComponent(EntityComponentTypes.Inventory);
                const container = inv?.container;
                const selectedSlot = player?.selectedSlotIndex;
                const heldItem = container?.getItem(selectedSlot);
                return heldItem?.typeId === "minecraft:fishing_rod";
            });
            if (fisher) {
                let player = fisher;
                let playerJob = player.getDynamicProperty("job:currentJob");
                let jobTitle = allJobs[playerJob].title;
                let jobLevel = player.getDynamicProperty(`job:${jobTitle}_level`);
                let job = allJobs[playerJob];
                let { initialReward, rewardStep, type, } = job;
                if (player.hasTag("job:hasEmployed") && playerJob !== undefined && typeof job.executeFishing === "function") {
                    if (type === "fishing") {
                        job.executeFishing(player, { reward: calculateNextValue(jobLevel, initialReward, rewardStep) });
                    }
                }
            }
            lastHookLocation = null;
        }
    }
}
export function jobMenuKillHandler(damageSource, entity) {
    if (damageSource.damagingEntity?.typeId !== "minecraft:player")
        return;
    let player = damageSource.damagingEntity;
    let playerJob = player.getDynamicProperty("job:currentJob");
    let jobTitle = allJobs[playerJob].title;
    let jobLevel = player.getDynamicProperty(`job:${jobTitle}_level`);
    let job = allJobs[playerJob];
    let { initialReward, rewardStep, type, } = job;
    if (player.hasTag("job:hasEmployed") && playerJob !== undefined && typeof job.execute === "function") {
        if (type === "kill_entity") {
            job.execute(player, { entity, reward: calculateNextValue(jobLevel, initialReward, rewardStep) });
        }
    }
}
export function jobMenuBlockBreakHandler(player, blockPerm) {
    let playerJob = player.getDynamicProperty("job:currentJob");
    if (playerJob === undefined)
        return;
    let jobTitle = allJobs[playerJob].title;
    let jobLevel = player.getDynamicProperty(`job:${jobTitle}_level`);
    let job = allJobs[playerJob];
    let { initialReward, rewardStep, type, } = job;
    if (player.hasTag("job:hasEmployed") && playerJob !== undefined && typeof job.executeBreak === "function") {
        if (type?.includes("break_block")) {
            job.executeBreak(player, { blockPerm, reward: calculateNextValue(jobLevel, initialReward, rewardStep) });
        }
    }
}
