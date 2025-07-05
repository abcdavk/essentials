import { EntityComponentTypes, EquipmentSlot, ItemStack, Player, system } from "@minecraft/server";
import { bannedItems } from "../auctionHouse/config";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { getActualName, itemTypeIdToName } from "../../utils";
import { itemSelldefaultPrice, itemSellPriceRegistry } from "./config";
import { Money } from "../money";

export function sellInvMenu(player: Player) {
  let form = new ActionFormData()
    .title('§f§0§1§r§l§0Inv Sell')
    .button('Sell Hand')
    .button('Sell Inventory')
  form.show(player).then(res => {
    if (res.selection === 0) sellHandSelectItem(player);
    if (res.selection === 1) sellAllItem(player);
  });
}

function sellAllItem(player: Player) {
  const inv = player.getComponent(EntityComponentTypes.Inventory);
  const con = inv?.container;
  if (!inv || !con) return;

  let totalPrice = 0;
  for (let i = 0; i < inv.inventorySize; i++) {
    const itemInv = con.getItem(i)
    if (itemInv && !bannedItems.includes(itemInv.typeId)) {
      totalPrice += getItemSellPrice(itemInv.typeId) * itemInv.amount;
    }
  }
  let confirm = new MessageFormData()
    .title(`Sell Inventory`)
    .body(`You will sell all items in your inventory for §a$${totalPrice.toFixed(2)}§r. Are you sure?`)
    .button1('No')
    .button2('Yes')
    .show(player).then(res => {
    if (res.selection === 1) {
      new Money().add(getActualName(player.nameTag), totalPrice);

      for (let i = 0; i < inv.inventorySize; i++) {
        const itemInv = con.getItem(i)
        if (itemInv && !bannedItems.includes(itemInv.typeId)) {
          con.setItem(i, undefined)
        }
      }
      player.sendMessage(`Successfully sell inventory. §a+$${totalPrice.toFixed(2)}§r`);
    }
  });
}

function sellHandSelectItem(player: Player) {
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
            sellHandOption(player, itemHand);
          } else {
            player.sendMessage('§cUnable to sell this item.')
          };
          player.addTag("ess:inAuctionUI");
          player.removeTag("ess:inAuctionSell");
          system.clearRun(runId);
        }
      } else {
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
      } else {
        system.clearRun(runTimoutId);
        player.removeTag("ess:inAuctionUI");
      }
    }, 10 * 20);
  }
}

function getItemSellPrice(itemId: string): number {
  for (const entry of itemSellPriceRegistry) {
    if (entry.includes) {
      if (itemId.includes(entry.item)) return entry.price;
    } else {
      if (itemId === entry.item) return entry.price;
    }
  }
  return itemSelldefaultPrice;
}


function sellHandOption(player: Player, itemStack: ItemStack) {
  const itemName = itemTypeIdToName(itemStack.typeId);
  let price = getItemSellPrice(itemStack.typeId);

  let inv = player.getComponent(EntityComponentTypes.Inventory);
  let con = inv?.container;

  if (!inv || !con) return;

  let itemCounter = 0;
  for (let i = 0; i < inv.inventorySize; i++) {
    let itemInv = con.getItem(i);
    if (itemInv && itemInv.typeId === itemStack.typeId) {
      itemCounter += itemInv.amount;
    }    
  }

  let form = new ModalFormData()
    .title(`Sell §l${itemName}`)
    .label(`Price: §a$${price}§e / each`)
    .slider('Amount to sell', 1, itemCounter, { defaultValue: itemCounter })
    .submitButton(`Sell §l${itemName}`);
  form.show(player).then(res => {
    if (res.formValues === undefined) return;
    // console.log(`${getActualName(player.nameTag)} sell ${itemStack.typeId}`)
    let amount = res.formValues[1];
    amount = parseFloat(amount as string);
    price = amount * price;
    let confirm = new MessageFormData()
      .title(`Sell §l${itemName}`)
      .body(`You will sell §e${amount}x§r §b${itemName}§r for §e$${price}§r. Are you sure?`)
      .button1('Edit')
      .button2('Sell')
      .show(player).then(res => {
      if (res.selection === 0) sellHandOption(player, itemStack);
      if (res.selection === 1) {
        new Money().add(getActualName(player.nameTag), price);

        player.runCommand(`clear @s ${itemStack.typeId} 0 ${amount}`);
        player.sendMessage(`Successfully sold §e${amount}x§r §b${itemName}§r for §a$${price}§r`);
      }
    });
  });
}