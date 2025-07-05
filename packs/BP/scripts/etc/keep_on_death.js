// scripts/main.ts
import { EntityComponentTypes, EquipmentSlot, ItemStack, Player, system, world } from "@minecraft/server";
var playerInventoryList = /* @__PURE__ */ new Map();
var playerEquipmentList = /* @__PURE__ */ new Map();
var playerXpList = /* @__PURE__ */ new Map();
var isPlayerDead = /* @__PURE__ */ new Map();
world.afterEvents.worldLoad.subscribe(() => {
    const newPlayerInventoryListString = world.getDynamicProperty("playerInventoryList");
    const newPlayerEquipmentListString = world.getDynamicProperty("playerEquipmentList");
    const newPlayerXpListString = world.getDynamicProperty("playerXpList");
    console.warn(newPlayerInventoryListString);
    console.warn(newPlayerEquipmentListString);
    console.warn(newPlayerXpListString);
    if (newPlayerInventoryListString === undefined) {
        console.error("playerInventoryList dynamic property is undefined");
        return;
    }
    if (newPlayerEquipmentListString === undefined) {
        console.error("playerEquipmentList dynamic property is undefined");
        return;
    }
    if (newPlayerXpListString === undefined) {
        console.error("playerXpList dynamic property is null");
        return;
    }
    let newPlayerInventoryList;
    let newPlayerEquipmentList;
    let newPlayerXpList;
    try {
        newPlayerInventoryList = JSON.parse(newPlayerInventoryListString);
    }
    catch (error) {
        console.error("Failed to parse playerInventoryList dynamic property as JSON", error);
        return;
    }
    try {
        newPlayerEquipmentList = JSON.parse(newPlayerEquipmentListString);
    }
    catch (error) {
        console.error("Failed to parse playerEquipmentList dynamic property as JSON", error);
        return;
    }
    try {
        newPlayerXpList = JSON.parse(newPlayerXpListString);
    }
    catch (error) {
        console.error("Failed to parse playerXpList dynamic property as JSON", error);
        return;
    }
    for (const [playerString, inventory] of Object.entries(newPlayerInventoryList)) {
        const player = JSON.parse(playerString);
        if (!(player instanceof Player)) {
            console.error(`Player ${player} does not exist`);
            continue;
        }
        if (!(inventory instanceof Map)) {
            console.error(`Inventory of player ${player} is not a valid Map`);
            continue;
        }
        for (const [slot, item] of inventory.entries()) {
            if (typeof slot !== "number") {
                console.error(`Slot ${slot} of player ${player} is not a valid number`);
                continue;
            }
            if (!(item instanceof ItemStack)) {
                console.error(`Item at slot ${slot} of player ${player} is not a valid ItemStack`);
                continue;
            }
            playerInventoryList.set(player, /* @__PURE__ */ new Map([[slot, item]]));
        }
    }
    for (const [playerString, equipment] of Object.entries(newPlayerEquipmentList)) {
        const player = JSON.parse(playerString);
        if (!(player instanceof Player)) {
            console.error(`Player ${player} does not exist`);
            continue;
        }
        if (!(equipment instanceof Map)) {
            console.error(`Equipment of player ${player} is not a valid Map`);
            continue;
        }
        for (const [slot, item] of equipment.entries()) {
            if (!(slot in EquipmentSlot)) {
                console.error(`Slot ${slot} of player ${player} is not a valid number`);
                continue;
            }
            if (!(item instanceof ItemStack)) {
                console.error(`Item at slot ${slot} of player ${player} is not a valid ItemStack`);
                continue;
            }
            playerEquipmentList.set(player, /* @__PURE__ */ new Map([[slot, item]]));
        }
    }
    for (const [playerString, xp] of Object.entries(newPlayerXpList)) {
        const player = JSON.parse(playerString);
        if (!(player instanceof Player)) {
            console.error(`Player ${player} does not exist`);
            continue;
        }
        if (typeof xp !== "number") {
            console.error(`Xp of player ${player} is not a valid number`);
            continue;
        }
        playerXpList.set(player, xp);
    }
});
world.afterEvents.entityHurt.subscribe((event) => {
    if (event.hurtEntity.typeId === "minecraft:player") {
        const player = event.hurtEntity;
        const healthComponent = player.getComponent(EntityComponentTypes.Health);
        if (!healthComponent)
            return;
        if (healthComponent.currentValue >= 1) {
            const tags = player.getTags();
            if (!tags)
                return;
            if (tags.includes("keep_on_death")) {
                const playerInventory = player.getComponent(EntityComponentTypes.Inventory);
                if (playerInventory && playerInventory.isValid) {
                    const container = playerInventory.container;
                    const newInventory = /* @__PURE__ */ new Map();
                    for (let i = 0; i < container.size; i++) {
                        let item = container.getItem(i);
                        if (!item)
                            continue;
                        newInventory.set(i, item);
                        console.warn(item.typeId);
                    }
                    playerInventoryList.set(player, newInventory);
                }
                const playerEquipment = player.getComponent(EntityComponentTypes.Equippable);
                if (playerEquipment && playerEquipment.isValid) {
                    const newEquipment = /* @__PURE__ */ new Map();
                    let headItem = playerEquipment.getEquipment(EquipmentSlot.Head);
                    if (headItem) {
                        newEquipment.set(EquipmentSlot.Head, headItem);
                    }
                    let chestItem = playerEquipment.getEquipment(EquipmentSlot.Chest);
                    if (chestItem) {
                        newEquipment.set(EquipmentSlot.Chest, chestItem);
                    }
                    let legsItem = playerEquipment.getEquipment(EquipmentSlot.Legs);
                    if (legsItem) {
                        newEquipment.set(EquipmentSlot.Legs, legsItem);
                    }
                    let feetItem = playerEquipment.getEquipment(EquipmentSlot.Feet);
                    if (feetItem) {
                        newEquipment.set(EquipmentSlot.Feet, feetItem);
                    }
                    let offHandItem = playerEquipment.getEquipment(EquipmentSlot.Offhand);
                    if (offHandItem) {
                        newEquipment.set(EquipmentSlot.Offhand, offHandItem);
                    }
                    playerEquipmentList.set(player, newEquipment);
                }
                const xp = player.getTotalXp();
                if (xp >= 0) {
                    playerXpList.set(player, xp);
                }
                world.setDynamicProperty("playerXpList", JSON.stringify(playerXpList));
                world.setDynamicProperty("playerEquipmentList", JSON.stringify(playerEquipmentList));
                world.setDynamicProperty("playerInventoryList", JSON.stringify(playerInventoryList));
            }
        }
    }
});
world.afterEvents.entityHurt.subscribe((event) => {
    const player = event.hurtEntity;
    const healthComponent = player.getComponent(EntityComponentTypes.Health);
    if (!healthComponent || healthComponent.currentValue > 0)
        return;
    const tags = player.getTags();
    if (tags?.includes("keep_on_death")) {
        player.dimension.getEntities({
            location: player.location,
            maxDistance: 2,
            type: "minecraft:item"
        }).forEach((entity) => entity.kill());
        system.runTimeout(() => {
            player.dimension.getEntities({
                location: player.location,
                maxDistance: 4,
                type: "minecraft:xp_orb"
            }).forEach((entity) => entity.kill());
        }, 21);
        isPlayerDead.set(player, true);
    }
});
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (isPlayerDead.get(player)) {
        system.runTimeout(() => {
            resetInventory(playerInventoryList.get(player), player);
            resetEquipment(playerEquipmentList.get(player), player);
            resetXp(playerXpList.get(player), player);
        }, 1);
        isPlayerDead.delete(player);
    }
});
function resetXp(newXp, player) {
    if (!player || newXp === void 0 || newXp < 0)
        return;
    player.addExperience(newXp);
}
function resetEquipment(equipment, player) {
    if (!player || !equipment) {
        return;
    }
    const playerEquipment = player.getComponent(EntityComponentTypes.Equippable);
    if (!playerEquipment || !playerEquipment.isValid) {
        console.error("Invalid equippable component");
        return;
    }
    equipment.forEach((item, slot) => {
        if (!item) {
            console.warn(`No item found for slot ${slot}`);
            return;
        }
        try {
            //@ts-ignore
            playerEquipment.setEquipment(slot, item);
        }
        catch (error) {
            console.error(`Failed to set equipment for slot ${slot}`, error);
        }
    });
}
function resetInventory(inventory, player) {
    if (!player || !inventory) {
        console.error("Player or inventory is undefined");
        return;
    }
    const playerInventory = player.getComponent(EntityComponentTypes.Inventory);
    if (!playerInventory?.isValid) {
        console.error("Invalid or missing inventory component");
        return;
    }
    const container = playerInventory.container;
    if (!container) {
        console.error("Invalid inventory container");
        return;
    }
    inventory.forEach((item, slot) => {
        if (!item) {
            console.warn(`No item found for slot ${slot}`);
            return;
        }
        try {
            container.setItem(slot, item);
        }
        catch (error) {
            console.error(`Failed to set item in slot ${slot}`, error);
        }
    });
}
system.afterEvents.scriptEventReceive.subscribe((event) => {
    const [id, command] = event.id?.split(":") || [];
    if (!id || !command)
        return;
    if (id !== "permanence")
        return;
    const targetName = event.message?.split(" ")[0];
    const target = targetName ? world.getPlayers().find((player) => player.name === targetName) : event.sourceEntity;
    if (!target) {
        console.error(`Player ${targetName} not found`);
        return;
    }
    switch (command.toLowerCase()) {
        case "togglekeepondeath":
            toggleKeepOnDeath(target);
            break;
    }
});
function toggleKeepOnDeath(player) {
    player.hasTag("keep_on_death") ? player.removeTag("keep_on_death") : player.addTag("keep_on_death");
    player.sendMessage(`Keep on death ${player.hasTag("keep_on_death") ? "enabled" : "disabled"} for player ${player.name}`);
}
//# sourceMappingURL=../debug/main.js.map
