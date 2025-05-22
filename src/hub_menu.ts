import { ItemStack, Player } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui"
import { jobMenuMainUI } from "./essentials/jobMenu/form_ui"
import { shopCategory } from "./essentials/shop/main";
import { changeTitleMenu } from "./essentials/title/form_ui";
import { auctionHouseMainUI } from "./essentials/auctionHouse/main";

export function hubMenu(player: Player, itemStack: ItemStack) {
  if (itemStack.typeId === "minecraft:compass") {
    let form = new ActionFormData()
      .title('§f§2§0§r§l§0Hub Menu')
      .button('', 'textures/ui/new_ui/M1')
      .button('', 'textures/ui/new_ui/M2')
      .button('', 'textures/ui/new_ui/M3')
      .button('', 'textures/ui/new_ui/M4')
    form.show(player).then(res => {
      if (res.selection === 0) shopMenu(player);
      if (res.selection === 2) jobMenuMainUI(player);
      if (res.selection === 3) hubSettings(player);
    });
  }
}

function shopMenu(player: Player) {
  let form = new ActionFormData()
    .title('§f§2§0§r§l§0Shop')
    .button('', 'textures/ui/new_ui/shop/S1')
    .button('', 'textures/ui/new_ui/shop/S2')
    .button('', 'textures/ui/new_ui/shop/S3')
    .button('', 'textures/ui/new_ui/shop/S4')
  form.show(player).then(res => {
    if (res.selection === 0) shopCategory(player);
    if (res.selection === 1) auctionHouseMainUI(player);
  });
}

function hubSettings(player: Player) {
  let form = new ActionFormData()
    .title('§f§2§1§r§l§0Settings')
    .button('', 'textures/ui/new_ui/settings/E1')
    .button('', 'textures/ui/new_ui/settings/E2')
  form.show(player).then(res => {
    if (res.selection === 0) {
      if (player.hasTag("deny_attack_player")) {
        player.removeTag("deny_attack_player");
        player.sendMessage("§cToggle PVP disabled");
      } else {
        player.addTag("deny_attack_player");
        player.sendMessage("§aToggle PVP enabled");
      }
    }
    if (res.selection === 1) changeTitleMenu(player);
  });
}