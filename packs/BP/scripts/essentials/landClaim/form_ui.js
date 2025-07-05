import { world } from "@minecraft/server";
import { Protection } from "./classes";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Money } from "../money";
export function handleSellPlotUI(player, block, dimension, protectionData) {
    const { x, y, z } = protectionData.location;
    let form = new ModalFormData()
        .title(`Sell Plot`)
        .toggle('Sell this plot', { defaultValue: protectionData.isSell })
        .textField('Sell price:', 'Type number', { defaultValue: protectionData.sellPrice.toString() });
    form.show(player).then(res => {
        if (res.formValues === undefined)
            return;
        // console.log(`${player.nameTag} sell ${itemStack.typeId}`)
        let [toggleSell, price] = res.formValues;
        price = parseFloat(price);
        if (!isNaN(price) && price >= 0) {
            if (toggleSell === false) {
                protectionData.isSell = false;
                new Protection().set(block.center(), protectionData);
                dimension.getEntities({ location: block.center(), type: "lc:protection_block" })[0].nameTag = ``;
            }
            else {
                protectionData.isSell = true;
                protectionData.sellPrice = price;
                new Protection().set(block.center(), protectionData);
                dimension.getEntities({ location: block.center(), type: "lc:protection_block" })[0].nameTag = `For sale!\n§a$${price}`;
            }
        }
        else {
            player.sendMessage("§cPlease enter a valid number!");
            player.removeTag("ess:inAuctionUI");
        }
    });
    // let form = new ActionFormData()
    //   .title(`§f§0§1§r§l§0Sell Plot`)
    //   .body(`Plot Name: §e${protectionData.settings.plotName}§r\nPlot Location: §e${x.toFixed(0)} ${y.toFixed(0)} ${z.toFixed(0)}§r\nPlot Size: §e${protectionData.protectionSize} blocks§r\n\nSell Price: §a$${sellPrice}\n\n\n\n\n\n\n\n\n\n\n`)
    // if (protectionData.isSell) {
    //   form.button("§l§cCancel Sell");
    // } else {
    //   form.button(`Sell for §l$${sellPrice}`);
    // }
    // form.show(player).then(res => {
    //   if (res.selection === undefined) return;
    //   if (protectionData.isSell) {
    //     protectionData.isSell = false;
    //     new Protection().set(block.center(), protectionData);
    //     dimension.getEntities({ location: block.center(), type: "lc:protection_block" })[0].nameTag = ``;
    //   } else {
    //     protectionData.isSell = true;
    //     new Protection().set(block.center(), protectionData);
    //     dimension.getEntities({ location: block.center(), type: "lc:protection_block" })[0].nameTag = `For sale!\n§a$${sellPrice}`;
    //   }
    // });
}
export function handleBuyPlotUI(player, block, dimension, protectionData) {
    const sellPrice = protectionData.sellPrice;
    const { x, y, z } = protectionData.location;
    let form = new ActionFormData()
        .title(`§f§0§1§r§l§0Buy Plot`)
        .body(`Plot Name: §e${protectionData.settings.plotName}§r\nPlot Location: §e${x.toFixed(0)} ${y.toFixed(0)} ${z.toFixed(0)}§r\nPlot Size: §e${protectionData.protectionSize} blocks§r\n\nSell Price: §a$${sellPrice}\n\n\n\n\n\n\n\n`)
        .button(`Cancel`)
        .button(`Buy for §l$${sellPrice}`);
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        if (res.selection === 1) {
            const isCanceled = new Money().remove(player.nameTag, sellPrice);
            if (!isCanceled) {
                new Money().add(protectionData.nameTag, sellPrice);
                player.sendMessage(`Successfully purchased plot at §e${x.toFixed(0)} ${y.toFixed(0)} ${z.toFixed(0)}§r for §a$${sellPrice}§r`);
                player.runCommand(`tellraw ${protectionData.nameTag} {"rawtext":[{"text":"§b${player.nameTag}§r buys your plot at §e${x.toFixed(0)} ${y.toFixed(0)} ${z.toFixed(0)}§r for §a$${sellPrice}§r"}]}`);
                protectionData.nameTag = player.nameTag;
                protectionData.allowList = [];
                protectionData.isSell = false;
                new Protection().set(block.center(), protectionData);
            }
            else {
                player.sendMessage(`§cYou don't have enough money! Total price: $${sellPrice}`);
            }
        }
    });
}
export function handleSettingUI(player, block, dimension, protectionData) {
    let form = new ModalFormData()
        .title("§f§0§1§r§l§0Rules")
        .textField("Land Name:", "Land Name", { defaultValue: protectionData.settings.plotName })
        .toggle("Show Boundaries", { defaultValue: protectionData.settings.showBoundaries, tooltip: "When enable, will display particle animation around the area." })
        .toggle("Anti Hostile", { defaultValue: protectionData.settings.anti_hostile, tooltip: "When enable, hostiles in the area will be removed." })
        .toggle("Anti TNT", { defaultValue: protectionData.settings.anti_tnt, tooltip: "When enable, active tnt in the area will be removed." })
        .toggle("Anti Minecart TNT", { defaultValue: protectionData.settings.anti_minecart_tnt, tooltip: "When enable, active minecart tnt in the area will be removed." })
        .toggle("Anti Creeper", { defaultValue: protectionData.settings.anti_creeper, tooltip: "When enable, creeper explosion in the area will be removed." })
        .toggle("Anti Arrow", { defaultValue: protectionData.settings.anti_arrow, tooltip: "When enable, the arrows in the area will be removed." })
        .toggle("Anti Splash Potion", { defaultValue: protectionData.settings.anti_splash_potion, tooltip: "When enable, splash potions in the area will be removed." })
        .toggle("Anti Fireball", { defaultValue: protectionData.settings.anti_fireball, tooltip: "When enable, will prevent fireballs from exploding in the area." })
        .toggle("Anti Wind Charge", { defaultValue: protectionData.settings.anti_wind_charge, tooltip: "When enable, thrown wind charge in the area will be removed." })
        .toggle("Anti End Crystal", { defaultValue: protectionData.settings.anti_end_crystal, tooltip: "When enable, active end crystal in the area will be removed." })
        .toggle("Allow Interact with Chest", { defaultValue: protectionData.settings.allow_interact_with_chest, tooltip: "When enable, other player will be able to open the chests in the plot." })
        .toggle("Allow Interact with Button", { defaultValue: protectionData.settings.allow_interact_with_button, tooltip: "When enable, other player will be able to use button in the plot." })
        .toggle("Allow Interact with Door", { defaultValue: protectionData.settings.allow_interact_with_door, tooltip: "When enable, other player will be able to open/close door in the plot." });
    form.show(player).then(res => {
        if (res.formValues) {
            const [plotName, showBoundaries, anti_hostile, anti_tnt, anti_minecart_tnt, anti_creeper, anti_arrow, anti_splash_potion, anti_fireball, anti_wind_charge, anti_end_crystal, allow_interact_with_chest, allow_interact_with_button, allow_interact_with_door] = res.formValues;
            protectionData.settings = {
                plotName,
                showBoundaries,
                anti_hostile,
                anti_tnt,
                anti_minecart_tnt,
                anti_creeper,
                anti_arrow,
                anti_splash_potion,
                anti_fireball,
                anti_wind_charge,
                anti_end_crystal,
                allow_interact_with_chest,
                allow_interact_with_button,
                allow_interact_with_door
            };
            new Protection().set(block.center(), protectionData);
        }
    });
}
export function handleAddFriendUI(player, block, dimension, protectionData) {
    const players = world.getPlayers();
    let playerList = ["None"];
    players.forEach(p => {
        if (p.nameTag !== player.nameTag)
            playerList.push(p.nameTag);
    });
    let form = new ModalFormData()
        .title("Invite")
        .dropdown("Select Online Player:", playerList, { defaultValueIndex: 0 })
        .textField("Or type player username", "Type here", { tooltip: "Type manually if the player is not in the dropdown/offline" });
    form.show(player).then(res => {
        if (res.formValues) {
            if (res.formValues[0] !== 0 && res.formValues[1] !== "") {
                player.sendMessage("§cCan only select one, dropdown or text field!");
            }
            else {
                if (res.formValues[0] !== 0) {
                    protectionData.allowList.push({
                        nameTag: playerList[res.formValues[0]],
                        allow_place_block: true,
                        allow_break_block: true,
                        allow_interact_with_block: true,
                        allow_tnt: false,
                        allow_button: true,
                        allow_lever: true,
                        allow_interact_armor_stand: true,
                        allow_attack_animals: true,
                        allow_attack_players: false,
                        allow_teleport_to_plot: false,
                    });
                    new Protection().set(block.center(), protectionData);
                }
                if (res.formValues[1] !== "") {
                    protectionData.allowList.push({
                        nameTag: res.formValues[1],
                        allow_place_block: true,
                        allow_break_block: true,
                        allow_interact_with_block: true,
                        allow_tnt: false,
                        allow_button: true,
                        allow_lever: true,
                        allow_interact_armor_stand: true,
                        allow_attack_animals: true,
                        allow_attack_players: false,
                        allow_teleport_to_plot: false
                    });
                    new Protection().set(block.center(), protectionData);
                }
            }
        }
    });
}
export function handleShowAllFriendUI(player, block, dimension, protectionData) {
    let form = new ActionFormData()
        .title("§f§0§1§r§l§0Team")
        .body("List of all friends.");
    let friendList = protectionData.allowList;
    // let friendCount = 0;
    for (let i = 0; i < friendList.length; i++) {
        // friendCount++
        form.button(`§r${friendList[i].nameTag}`);
    }
    form.show(player).then(res => {
        if (res.selection !== undefined) {
            handleFriendSettingUI(player, block, dimension, protectionData, friendList[res.selection]);
        }
    });
}
function handleFriendSettingUI(player, block, dimension, protectionData, allowList) {
    let { allow_place_block, allow_break_block, allow_interact_with_block, allow_tnt, allow_button, allow_lever, allow_interact_armor_stand, allow_attack_animals, allow_attack_players, allow_teleport_to_plot } = allowList;
    let form = new ModalFormData()
        .title(allowList.nameTag + " Rules")
        .toggle("Allow Place Block", { defaultValue: allow_place_block })
        .toggle("Allow Break Block", { defaultValue: allow_break_block })
        .toggle("Allow Interact with Block", { defaultValue: allow_interact_with_block })
        .toggle("Allow TNT", { defaultValue: allow_tnt })
        .toggle("Allow Button", { defaultValue: allow_button })
        .toggle("Allow Lever", { defaultValue: allow_lever })
        .toggle("Allow Interact with Armor Stand", { defaultValue: allow_interact_armor_stand })
        .toggle("Allow Attack Animals", { defaultValue: allow_attack_animals })
        .toggle("Allow Attack Players", { defaultValue: allow_attack_players })
        .toggle("Allow Teleport to Plot", { defaultValue: allow_teleport_to_plot });
    form.show(player).then(res => {
        if (res.formValues) {
            let friendList = protectionData.allowList;
            friendList = friendList.filter(friend => {
                return !(friend.nameTag === allowList.nameTag);
            });
            friendList.push({
                nameTag: allowList.nameTag,
                allow_place_block: res.formValues[0],
                allow_break_block: res.formValues[1],
                allow_interact_with_block: res.formValues[2],
                allow_tnt: res.formValues[3],
                allow_button: res.formValues[4],
                allow_lever: res.formValues[5],
                allow_interact_armor_stand: res.formValues[6],
                allow_attack_animals: res.formValues[7],
                allow_attack_players: res.formValues[8],
                allow_teleport_to_plot: res.formValues[9],
            });
            protectionData.allowList = friendList;
            new Protection().set(block.center(), protectionData);
        }
    });
}
export function handleRemoveFriendUI(player, block, dimension, protectionData) {
    let form = new ActionFormData()
        .title("§f§0§1§r§l§0Kick")
        .body("Select to remove.");
    let friendList = protectionData.allowList;
    for (let i = 0; i < friendList.length; i++) {
        form.button(`§r${friendList[i].nameTag}`);
    }
    form.show(player).then(res => {
        if (res.selection !== undefined) {
            handleRemoveConfirmationUI(player, block, dimension, protectionData, friendList[res.selection]);
        }
    });
}
function handleRemoveConfirmationUI(player, block, dimension, protectionData, allowList) {
    let friendName = allowList.nameTag;
    let form = new ActionFormData()
        .title("§f§0§1§r§l§0Kick")
        .body(`Do you really want to remove §b${friendName}§r from the friend list?\n\n\n\n\n\n\n\n\n`)
        .button("§fYes")
        .button("Cancel");
    form.show(player).then(res => {
        if (res.selection === 0) {
            let friendList = protectionData.allowList;
            friendList = friendList.filter(friend => {
                return !(friend.nameTag === allowList.nameTag);
            });
            protectionData.allowList = friendList;
            new Protection().set(block.center(), protectionData);
            handleRemoveFriendUI(player, block, dimension, new Protection().get(block.center()));
        }
        else {
            handleRemoveFriendUI(player, block, dimension, protectionData);
        }
    });
}
