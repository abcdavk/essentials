import { EntityComponent, EntityComponentTypes, ItemStack, Player, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { Money } from "../money";
import { formatNumber, itemTypeIdToName } from "../../utils";
import { QIDB } from "../../QIDB";

let Inventories: QIDB

system.run(() => {
  Inventories = new QIDB('inventories', 10, 270)
});

const bannedItems = [
  "dave:hub_menu",
  "dave:admin_menu"
];

export function auctionHouseSetup(player: Player) {
  player.removeTag("ess:inAuctionSell");
}

export function auctionHouseMainUI(player: Player) {
  let form = new ActionFormData()
    .title('§f§0§1§r§l§0Select Category')
    .button("Auction House")
    .button("Sell To Auction");
  form.show(player).then(res => {
    if (res.selection === 0) auctionHouseCatalog(player);
    if (res.selection === 1) auctionHouseSellItem(player);
  });
}

function auctionHouseCatalog(player: Player) {
  const allItems = Inventories.keys();
  let form = new ActionFormData()
    .title(`§f§2§2§r§l§0   AuctionHouse\n   $${formatNumber(new Money().get(player.nameTag))}`)
  for (let i = 0; i < allItems.length; i++) {
    const soldItem = Inventories.get(allItems[i]) as ItemStack;
    form.button(`§r${itemTypeIdToName(soldItem.typeId)}`);
    
  }
  form.show(player).then(res => {
    if (res.selection === undefined) return;
  });
}

function auctionHouseSellItem(player: Player) {
  if (!player.hasTag("ess:inAuctionSell")) {
    player.addTag("ess:inAuctionSell");
    player.sendMessage("§eHold item you want to sell then sneak to confirm!");

    let runId = system.runInterval(() => {
      const inv = player.getComponent(EntityComponentTypes.Inventory);
      const con = inv?.container;

      if (inv && con && player.hasTag("ess:inAuctionSell")) {
        const itemHand = con.getItem(player.selectedSlotIndex);
        if (player.isSneaking && itemHand !== undefined) {
          if (bannedItems.includes(itemHand.typeId)) return;
          auctionHouseSellOption(player, itemHand);

          player.removeTag("ess:inAuctionSell");
          system.clearRun(runId);
        }
      } else {
          system.clearRun(runId);
      }
    });
  }
}

function auctionHouseSellOption(player: Player, itemStack: ItemStack) {
  let form = new ModalFormData()
    .title(`Sell §l${itemTypeIdToName(itemStack.typeId)}`)
    .label(`Market price: $0.15 / each`)
    .textField('Sell price:', '0.15', { defaultValue: '2' })
    .submitButton(`Sell §l${itemTypeIdToName(itemStack.typeId)}`)
  form.show(player).then(res => {
    if (res.canceled) return;
    console.log(`${player.nameTag} sell ${itemStack.typeId}`)
    Inventories.set(`${player.nameTag}`, itemStack);
  });
}