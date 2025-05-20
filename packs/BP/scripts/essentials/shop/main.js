import { ActionFormData } from "@minecraft/server-ui";
import { itemTypeIdToName } from "../../utils";
import { shopRegistry } from "./config";
export function shopCategory(player) {
    let form = new ActionFormData()
        .title('§f§0§1§r§l§0Select Category');
    shopRegistry.forEach(shop => {
        form.button(shop.category);
    });
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        shopListHandler(player, shopRegistry[res.selection]);
    });
}
function shopListHandler(player, shop) {
    const { category, itemList } = shop;
    console.warn("test");
    let form = new ActionFormData()
        .title(`§f§2§2§r§l§0Buy ${category}`);
    for (let i = 0; i < itemList.length; i++) {
        let { typeId, price, texture } = itemList[i];
        typeId = itemTypeIdToName(typeId);
        form.button(`${typeId}\n§a$${itemList[i].price}`, "textures/" + itemList[i].texture);
    }
    form.show(player).then(res => {
    });
}
