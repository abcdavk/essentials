import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { itemTypeIdToName, formatNumber, convertTypeIdToAuxIcon, getActualName } from "../../utils";
import { shopRegistry } from "./config";
import { Money } from "../money";
import { TitleData } from "../title/main";
export function shopCategory(player) {
    let form = new ActionFormData()
        .title('§f§0§1§r§l§0Select Category');
    shopRegistry.forEach(shop => {
        form.button(shop.category);
    });
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        if (shopRegistry[res.selection].type === "item")
            handleShopList(player, shopRegistry[res.selection]);
        if (shopRegistry[res.selection].type === "title")
            handleTitleLevel(player, shopRegistry[res.selection]);
    });
}
function handleTitleLevel(player, title) {
    const category = title.category;
    const titleList = title.titleList;
    const ownedTitle = new TitleData().getArray(getActualName(player.nameTag));
    let form = new ActionFormData()
        .title(`§f§2§2§r§l§0Buy ${category}\n§r§2$${formatNumber(new Money().get(getActualName(player.nameTag)))}`);
    for (let i = 0; i < titleList.length; i++) {
        let { name, price, texture } = titleList[i];
        let hasPurchased = !ownedTitle.includes(name) ? `§r${name}\n§a$${price}` : `§m§0§0§r${name}\n§7Purchased`;
        form.button(hasPurchased, convertTypeIdToAuxIcon(texture));
    }
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        handleBuyTitle(player, titleList[res.selection]);
    });
}
function handleBuyTitle(player, title) {
    const { name, price, color } = title;
    let form = new ActionFormData()
        .title(`§f§3§0§r§0Buy §l${name}§r§0`)
        .body(`§l${color}${name} §r${getActualName(player.nameTag)}\n\n\n\n\n\n\n\n\n`)
        .button(`Buy for §l$${formatNumber(price)}`)
        .button(`Cancel`);
    form.show(player).then(res => {
        if (res.selection === 0) {
            const isCanceled = new Money().remove(getActualName(player.nameTag), price);
            if (!isCanceled) {
                new TitleData().add(getActualName(player.nameTag), name);
                player.sendMessage(`Successfully purchased §b${name}§r for §a$${price}§r`);
            }
            else {
                player.sendMessage(`§cYou don't have enough money! Total price: $${price}`);
            }
        }
    });
}
function handleShopList(player, shop) {
    const category = shop.category;
    const itemList = shop.itemList;
    let form = new ActionFormData()
        .title(`§f§2§2§r§l§0Buy ${category}\n§r§2$${formatNumber(new Money().get(getActualName(player.nameTag)))}`);
    for (let i = 0; i < itemList.length; i++) {
        let { typeId, price, per } = itemList[i];
        let itemName = itemTypeIdToName(typeId);
        let itemInfo = per === undefined ? `${itemName}` : `${per}x ${itemName}`;
        let icon = convertTypeIdToAuxIcon(typeId);
        form.button(`§r${itemInfo}\n§a$${price}`, icon);
    }
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        handleBuyItem(player, itemList[res.selection]);
    });
}
function handleBuyItem(player, item) {
    let { typeId, price, per } = item;
    let parseItemName = itemTypeIdToName(typeId);
    let itemInfo = per === undefined ? `${parseItemName}` : `${per}x ${parseItemName}`;
    let form = new ModalFormData()
        .title(`Buy §l${itemInfo}`)
        .textField(`\nItem: §e${itemInfo}§r\nPrice: §e$${price} / each§r\n\n\n\n\n\nAmount:`, "1", { defaultValue: "1" })
        .submitButton("§lBuy");
    form.show(player).then(res => {
        if (res.formValues === undefined)
            return;
        let amount = parseInt(res.formValues[0]);
        if (!isNaN(amount) && amount > 0) {
            const totalPrice = price * amount;
            const isCanceled = new Money().remove(getActualName(player.nameTag), totalPrice);
            if (!isCanceled) {
                amount = per === undefined ? amount : amount * per;
                player.sendMessage(`Successfully purchased §e${amount}x§r §b${parseItemName}§r for §a$${totalPrice.toFixed(2)}§r`);
                player.runCommand(`give @s ${typeId} ${amount}`);
            }
            else {
                player.sendMessage(`§cYou don't have enough money! Total price: $${totalPrice.toFixed(2)}`);
            }
        }
        else {
            player.sendMessage("§cPlease enter a valid number! Must be greater than zero.");
        }
    });
}
