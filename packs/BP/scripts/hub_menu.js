import { EntityComponentTypes, EquipmentSlot, ItemLockMode, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { jobMenuMainUI } from "./essentials/jobMenu/form_ui";
import { shopCategory } from "./essentials/shop/main";
import { changeTitleMenu } from "./essentials/title/form_ui";
import { auctionHouseMainUI } from "./essentials/auctionHouse/main";
import { playerSendMoney } from "./essentials/money";
import { sellInvMenu } from "./essentials/sellHand/main";
import { teleportRandom, teleportSpawn } from "./essentials/teleports/main";
import { teleportAsk, teleportPlot, teleportRequest } from "./essentials/teleports/form_ui";
export function hubMenuSetup(player) {
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    if (!player.hasTag("ess:hub_menu_give")) {
        const itemStack = new ItemStack("dave:hub_menu");
        itemStack.keepOnDeath = true;
        itemStack.lockMode = ItemLockMode.inventory;
        equip?.setEquipment(EquipmentSlot.Mainhand, itemStack);
        player.addTag("ess:hub_menu_give");
    }
}
export function hubMenu(player, itemStack) {
    if (itemStack.typeId === "dave:hub_menu") {
        let form = new ActionFormData()
            .title('§f§2§0§r§l§0Hub Menu')
            .button('', 'textures/ui/new_ui/M1')
            .button('', 'textures/ui/new_ui/M2')
            .button('', 'textures/ui/new_ui/M3')
            .button('', 'textures/ui/new_ui/M4');
        form.show(player).then(res => {
            if (res.selection === 0)
                shopMenu(player);
            if (res.selection === 1)
                teleportMenu(player);
            if (res.selection === 2)
                jobMenuMainUI(player);
            if (res.selection === 3)
                hubSettings(player);
        });
    }
}
function teleportMenu(player) {
    let form = new ActionFormData()
        .title('§f§2§5§r§l§0Shop')
        .button('', 'textures/ui/new_ui/tp/T1')
        .button('', 'textures/ui/new_ui/tp/T5')
        .button('', 'textures/ui/new_ui/tp/T2')
        .button('', 'textures/ui/new_ui/tp/T3')
        .button('', 'textures/ui/new_ui/tp/T4');
    form.show(player).then(res => {
        if (res.selection === 0)
            teleportSpawn(player);
        if (res.selection === 1)
            teleportRandom(player);
        if (res.selection === 2)
            teleportPlot(player);
        if (res.selection === 3)
            teleportAsk(player);
        if (res.selection === 4)
            teleportRequest(player);
    });
}
function shopMenu(player) {
    let form = new ActionFormData()
        .title('§f§2§0§r§l§0Shop')
        .button('', 'textures/ui/new_ui/shop/S1')
        .button('', 'textures/ui/new_ui/shop/S2')
        .button('', 'textures/ui/new_ui/shop/S3')
        .button('', 'textures/ui/new_ui/shop/S4');
    form.show(player).then(res => {
        if (res.selection === 0)
            shopCategory(player);
        if (res.selection === 1)
            auctionHouseMainUI(player);
        if (res.selection === 2)
            playerSendMoney(player);
        if (res.selection === 3)
            sellInvMenu(player);
    });
}
function hubSettings(player) {
    let form = new ActionFormData()
        .title('§f§2§1§r§l§0Settings')
        .button('', 'textures/ui/new_ui/settings/E1')
        .button('', 'textures/ui/new_ui/settings/E2');
    form.show(player).then(res => {
        if (res.selection === 0) {
            if (player.hasTag("deny_attack_player")) {
                player.addTag("pvp_enabled");
                player.removeTag("keep_inventory");
                player.removeTag("deny_attack_player");
                player.sendMessage("§aToggle PVP enabled");
            }
            else {
                player.removeTag("pvp_enabled");
                player.addTag("keep_inventory");
                player.addTag("deny_attack_player");
                player.sendMessage("§cToggle PVP disabled");
            }
        }
        if (res.selection === 1)
            changeTitleMenu(player);
    });
}
