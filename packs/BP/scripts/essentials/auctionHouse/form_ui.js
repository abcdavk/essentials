import { EntityComponentTypes, EquipmentSlot, ItemComponentTypes, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { AuctionHouse } from "./main";
import { convertTypeIdToAuxIcon, formatNumber, getActualName, itemTypeIdToName, truncateWithDots } from "../../utils";
import { bannedItems } from "./config";
import { Money } from "../money";
import { QIDB } from "../../QIDB";
let Inventories;
system.run(() => {
    if (world.getDynamicProperty("ess:has_database_init")) {
        Inventories = new QIDB('auction_house', 10, 270);
    }
});
export function auctionHouseSeller(player) {
    const auctionHouse = new AuctionHouse();
    const auctionData = auctionHouse.getAll();
    const auctionItems = [];
    let form = new ActionFormData()
        .title(`§f§2§2§r§l§0AuctionHouse\n§r§2$${formatNumber(new Money().get(getActualName(player.nameTag)))}`);
    for (const auction of auctionData) {
        if (auction.nameTag !== getActualName(player.nameTag))
            continue;
        for (const entry of auction.auctionList) {
            const { id, amount, price } = entry;
            const soldItem = Inventories.get(id);
            const soldItemEnchantments = soldItem?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];
            if (!soldItem)
                continue;
            const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId);
            const soldInfo = amount > 1
                ? `x${amount}\n${itemName}`
                : itemName;
            const icon = soldItemEnchantments.length > 0 ? convertTypeIdToAuxIcon(soldItem.typeId, true) : convertTypeIdToAuxIcon(soldItem.typeId);
            const buttonText = `§r${truncateWithDots(soldInfo)}\n§a$${parseFloat(price.toFixed(4))}`;
            form.button(buttonText, icon);
            auctionItems.push({ item: soldItem, seller: auction.nameTag, data: entry });
        }
    }
    form.show(player).then(res => {
        if (res.canceled || res.selection === undefined)
            return;
        const selected = auctionItems[res.selection];
        if (!selected)
            return; // Extra safety check
        auctionHouseEdit(player, selected.item, selected.data);
    });
}
function auctionHouseEdit(player, soldItem, auctionSold) {
    const auctionHouse = new AuctionHouse();
    const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId);
    const form = new ModalFormData()
        .title(`Edit §l${itemName}`)
        .toggle(`Remove and withdraw ${itemName}`)
        .textField("Edit price", "", { defaultValue: auctionSold.price.toString() });
    form.show(player).then(res => {
        if (!res.formValues || res.canceled)
            return;
        const remove = res.formValues[0];
        const newPrice = parseFloat(res.formValues[1]);
        if (isNaN(newPrice) || newPrice < 0) {
            player.sendMessage("§cInvalid price input.");
            return;
        }
        if (remove) {
            player.dimension.spawnItem(soldItem, player.location);
            auctionHouse.remove(getActualName(player.nameTag), auctionSold.id);
        }
        else if (newPrice !== auctionSold.price) {
            auctionHouse.remove(getActualName(player.nameTag), auctionSold.id);
            auctionHouse.add(getActualName(player.nameTag), newPrice, auctionSold.amount, soldItem);
            auctionHouseSeller(player);
        }
    });
}
export function auctionHouseCatalog(player) {
    const auctionData = new AuctionHouse().getAll();
    const auctionItems = [];
    let form = new ActionFormData()
        .title(`§f§2§2§r§l§0AuctionHouse\n§r§2$${formatNumber(new Money().get(getActualName(player.nameTag)))}`);
    auctionData.forEach(auction => {
        for (let i = 0; i < auction.auctionList.length; i++) {
            const { id, amount, price } = auction.auctionList[i];
            const soldItem = Inventories.get(id);
            const soldItemEnchantments = soldItem?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];
            if (!soldItem)
                continue;
            const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId);
            const soldInfo = amount > 1
                ? `x${amount}\n${itemName}`
                : itemName;
            const icon = soldItemEnchantments.length > 0 ? convertTypeIdToAuxIcon(soldItem.typeId, true) : convertTypeIdToAuxIcon(soldItem.typeId);
            const buttonText = `§r${truncateWithDots(soldInfo)}\n§a$${parseFloat(price.toFixed(4))}`;
            form.button(buttonText, icon);
            auctionItems.push({ item: soldItem, seller: auction.nameTag, data: auction.auctionList[i] });
        }
    });
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        const selected = auctionItems[res.selection];
        if (selected) {
            auctionHouseBuy(player, selected.seller, selected.item, selected.data);
        }
    });
}
function auctionHouseBuy(player, seller, soldItem, auctionSold) {
    let { id, price, amount, expire } = auctionSold;
    const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId);
    const soldItemEnchantments = soldItem?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];
    let enchantList = ['Enchantment:'];
    for (const enchant of soldItemEnchantments) {
        enchantList.push(`§7 - §9${itemTypeIdToName(enchant.type.id)} ${enchant.level}§r`);
    }
    const enchantInfo = soldItemEnchantments.length > 0 ? enchantList.join('\n') + '\n' : '';
    const lineSpace = "\n".repeat(8 - soldItemEnchantments.length);
    const buyButton = getActualName(player.nameTag) === seller ? `§m§0§0§7Buy for §l$${formatNumber(price)}` : `Buy for §l$${formatNumber(price)}`;
    let form = new ActionFormData()
        .title(`§f§0§1§r§0Buy §l${itemName}`)
        .body(`§7Item: §b${itemName}§7\n${enchantInfo}§7\nAmount: §e${amount}§7\nPrice: §a$${price}§7\n\nExpire at: §e${new Date(expire).toDateString()}§7\nSeller: §e${seller}${lineSpace}`)
        .button(buyButton);
    form.show(player).then(res => {
        if (res.selection === 0) {
            if (new AuctionHouse().checkAvailability(seller, id)) {
                const isCanceled = new Money().remove(getActualName(player.nameTag), price);
                if (!isCanceled) {
                    new AuctionHouse().remove(seller, id);
                    new Money().add(seller, price);
                    player.runCommand(`tellraw ${seller} {"rawtext":[{"text":"§b${getActualName(player.nameTag)}§r buys §b${amount}x ${itemName}§r from you for §a$${price}"}]}`);
                    player.sendMessage(`Successfully purchased §e${amount}x§r §b${itemName}§r for §a$${price.toFixed(2)}§r`);
                    player.dimension.spawnItem(soldItem, player.location);
                }
                else {
                    player.sendMessage(`§cYou don't have enough money! Total price: $${price.toFixed(2)}`);
                }
            }
            else {
                player.sendMessage(`§cSorry, the item has been sold.`);
            }
        }
    });
}
export function auctionHouseSellItem(player) {
    if (!player.hasTag("ess:inAuctionSell")) {
        player.addTag("ess:inAuctionSell");
        player.sendMessage("§eHold item you want to sell then sneak to confirm!");
        let runId = system.runInterval(() => {
            const inv = player.getComponent(EntityComponentTypes.Inventory);
            const con = inv?.container;
            if (inv && con && player.hasTag("ess:inAuctionSell")) {
                const itemHand = con.getItem(player.selectedSlotIndex);
                if (player.isSneaking && itemHand !== undefined) {
                    if (!bannedItems.includes(itemHand.typeId)) {
                        auctionHouseSellOption(player, itemHand);
                    }
                    else {
                        player.sendMessage('§cUnable to sell this item.');
                    }
                    ;
                    player.addTag("ess:inAuctionUI");
                    player.removeTag("ess:inAuctionSell");
                    system.clearRun(runId);
                }
            }
            else {
                player.addTag("ess:inAuctionUI");
                player.removeTag("ess:inAuctionSell");
                system.clearRun(runId);
            }
        });
        let runTimoutId = system.runTimeout(() => {
            if (!player.hasTag("ess:inAuctionUI")) {
                player.removeTag("ess:inAuctionSell");
                player.sendMessage("§cTimeout!");
                system.clearRun(runId);
            }
            else {
                system.clearRun(runTimoutId);
                player.removeTag("ess:inAuctionUI");
            }
        }, 10 * 20);
    }
}
function auctionHouseSellOption(player, itemStack) {
    const itemName = itemStack.nameTag !== undefined ? itemStack.nameTag : itemTypeIdToName(itemStack.typeId);
    // const inv = player.getComponent(EntityComponentTypes.Inventory);
    // const con = inv?.container;
    // if (!inv || !con) return;
    // let totalItems = 0;
    // for (let i = 0; i < inv?.inventorySize; i++) {
    //   let itemInv = con.getItem(i);
    //   if (itemInv && itemInv.typeId === itemStack.typeId) {
    //     totalItems += itemInv.amount;
    //   }
    // }
    let form = new ModalFormData()
        .title(`Sell §l${itemName}`)
        .slider('Amount to sell', 1, itemStack.amount, { defaultValue: itemStack.amount })
        .textField('Sell price:', 'Type number')
        .submitButton(`Sell §l${itemName}`);
    form.show(player).then(res => {
        if (res.formValues === undefined)
            return;
        // console.log(`${getActualName(player.nameTag)} sell ${itemStack.typeId}`)
        let [amount, price] = res.formValues;
        price = parseFloat(price);
        amount = parseFloat(amount);
        if (!isNaN(price) && !isNaN(amount) && price > 0 && amount > 0) {
            let confirm = new MessageFormData()
                .title(`Sell §l${itemName}`)
                .body(`You will sell §e${amount}x§r §b${itemName}§r for §e$${price}§r. Are you sure?`)
                .button1('Edit')
                .button2('Sell')
                .show(player).then(res => {
                if (res.selection === 0)
                    auctionHouseSellOption(player, itemStack);
                if (res.selection === 1) {
                    if (amount === itemStack.amount) {
                        player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, undefined);
                    }
                    else {
                        let newItemStack = itemStack;
                        newItemStack.amount -= amount;
                        player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, newItemStack);
                    }
                    let soldItem = itemStack;
                    soldItem.amount = amount;
                    new AuctionHouse().add(getActualName(player.nameTag), price, amount, soldItem);
                    player.sendMessage(`Successfully sold §e${amount}x§r §b${itemName}§r for §a$${price}§r`);
                }
            });
        }
        else {
            player.sendMessage("§cPlease enter a valid number! Must be greater than zero.");
            player.removeTag("ess:inAuctionUI");
        }
    });
}
