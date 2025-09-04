import { EntityComponentTypes, EquipmentSlot, ItemComponentTypes, ItemStack, Player, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { convertTypeIdToAuxIcon, formatNumber, getActualName, itemTypeIdToName, truncateWithDots } from "../../utils";
import { Money } from "../money";
import { BountyBoard } from "./main";
import { QIDB } from "../../QIDB";
import { BountyList } from "../../interfaces";
import { bannedItems } from "../auctionHouse/config";

let Inventories: QIDB

system.run(() => {
  if (world.getDynamicProperty("ess:has_database_init")) {
    Inventories = new QIDB('bounty_board', 10, 270);
  }
});

export function bountyBoardCatalog(player: Player) {
  const bountyData = new BountyBoard().getAll();
  const bountyItems: { item: ItemStack; seller: string, data: any }[] = [];

  let form = new ActionFormData()
    .title(`§f§2§2§r§l§0Bounty Board\n§r§2$${formatNumber(new Money().get(getActualName(player.nameTag)))}`);

  bountyData.forEach(bounty => {
    for (let i = 0; i < bounty.bountyList.length; i++) {
      const { id, amount, price, completed } = bounty.bountyList[i];
      const soldItem = Inventories.get(id) as ItemStack;
      const soldItemEnchantments = soldItem?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];

      if (!soldItem) continue;
      if (completed) continue;

      const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId);

      const soldInfo = amount > 1
        ? `x${amount}\n${itemName}`
        : itemName;

      const icon = soldItemEnchantments.length > 0 ? convertTypeIdToAuxIcon(soldItem.typeId, true) : convertTypeIdToAuxIcon(soldItem.typeId);
      const buttonText = `§r${truncateWithDots(soldInfo)}\n§a$${parseFloat(price.toFixed(4))}`;

      form.button(buttonText, icon);
      bountyItems.push({ item: soldItem, seller: bounty.nameTag, data: bounty.bountyList[i] });
    }
  });

  form.show(player).then(res => {
    if (res.selection === undefined) return;
    const selected = bountyItems[res.selection];
    if (selected) {
      bountyBoardTake(player, selected.seller, selected.item, selected.data);
    }
  });
}

function bountyBoardTake(player: Player, seller: string, wantedItem: ItemStack, bountyList: BountyList) {
  let { id, price, amount, expire, completed } = bountyList;
  const itemName = wantedItem.nameTag !== undefined ? wantedItem.nameTag : itemTypeIdToName(wantedItem.typeId);
  const wantedItemEnchantments = wantedItem?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];

  let enchantList = ['Enchantment:']
  for (const enchant of wantedItemEnchantments) {
    enchantList.push(`§7 - §9${itemTypeIdToName(enchant.type.id)} ${enchant.level}§r`)
  }
  const enchantInfo = wantedItemEnchantments.length > 0 ? enchantList.join('\n') + '\n' : '';
  const lineSpace = "\n".repeat(8 - wantedItemEnchantments.length);
  const buyButton = getActualName(player.nameTag) === seller ? `§m§0§0§7Take Bounty` : `Take Bounty`;
  let form = new ActionFormData()
    .title(`§f§0§1§r§0Help wanted §l${itemName}`)
    .body(`§7Item: §b${itemName}§7\n${enchantInfo}§7\nAmount: §e${amount}§7\nReward: §a$${price}§7\n\nExpire at: §e${new Date(expire).toDateString()}§7\nSeller: §e${seller}${lineSpace}`)
    .button(buyButton)
  form.show(player).then(res => {
    if (res.selection === 0) {
      if (new BountyBoard().checkAvailability(seller, id) && completed === false) {
        const inv = player.getComponent(EntityComponentTypes.Inventory);
        const con = inv?.container;
        if (!inv || !con) return;
        let totalItems = 0;
        for (let i = 0; i < inv?.inventorySize; i++) {
          let itemInv = con.getItem(i);
          if (itemInv && itemInv.typeId === wantedItem.typeId) {
            if (wantedItemEnchantments.length > 0) {
              const itemInvEnchantments = itemInv.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];
              for (const invEnchant of itemInvEnchantments) {
                for (const wantEnchant of wantedItemEnchantments) {
                  if (
                    invEnchant.type === wantEnchant.type &&
                    invEnchant.level === wantEnchant.level
                  ) {
                    totalItems += itemInv.amount;
                  }
                }
              }
            } else {
              totalItems += itemInv.amount;
            }
          }
        }
        let success = false;
        if (totalItems >= amount) {
          if (wantedItemEnchantments.length > 0) {
            for (let i = 0; i < inv?.inventorySize; i++) {
              let itemInv = con.getItem(i);
              if (itemInv && itemInv.typeId === wantedItem.typeId) {
                const itemInvEnchantments = itemInv.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];
                for (const invEnchant of itemInvEnchantments) {
                  for (const wantEnchant of wantedItemEnchantments) {
                    if (
                      invEnchant.type === wantEnchant.type &&
                      invEnchant.level === wantEnchant.level
                    ) {
                      con.setItem(i, undefined);
                      success = true
                    } else {
                      player.sendMessage(`§cEnchantment does not match.`)
                      break;
                    }
                  }
                }
              }
            }
          } else {
            player.runCommand(`clear @s ${wantedItem.typeId} 0 ${amount}`);
            success = true;
          }

          if (success) {
            // let bountyBoard = new BountyBoard();
            // bountyBoard.remove(seller, id);
            // let playerBounty = bountyBoard.get(seller);
            // playerBounty.push({ id, price, amount, expire, completed: true });

            // bountyBoard.set(seller, playerBounty);

            new BountyBoard().update(seller, {
              id,
              price,
              amount,
              expire,
              completed: true
            }, wantedItem);

            new Money().add(getActualName(player.nameTag), price);
            player.sendMessage(`Successfully complete bounty §e${amount}x§r §b${itemName}§r for §a$${price.toFixed(2)}§r`);
            player.runCommand(`tellraw ${seller} {"rawtext":[{"text":"§b${getActualName(player.nameTag)}§r complete bounty §b${amount}x ${itemName}§r from you for §a$${price}"}]}`)
          }
        } else {
          player.sendMessage(`§cYou don't have enough item! Wanted ${amount}x ${itemName}`);
        }
      } else {
        player.sendMessage(`§cSorry, bounty has been taken by another player.`)
      }
    }
  });
}

export function bountyBoardMainUI(player: Player) {
  let form = new ActionFormData()
    .title('§f§0§1§r§l§0Select Category')
    .button("Bounty Board")
    .button("Create a Bounty");
    if (new BountyBoard().get(getActualName(player.nameTag)).length > 0) {
      form.button("Your Bounty");
    }
  form.show(player).then(res => {
    if (res.selection === 0) bountyBoardCatalog(player);
    if (res.selection === 1) {
      if (new BountyBoard().get(getActualName(player.nameTag)).length <= 10) {
        bountyBoardPlaceItem(player);
      } else {
        player.sendMessage('§cMax Bounty reached!');
      }
    }
    if (res.selection === 2) {
      bountyBoardOwner(player);
    }
  });
}

export function bountyBoardPlaceItem(player: Player) {
  if (!player.hasTag("ess:inAuctionSell")) {
    player.addTag("ess:inAuctionSell");
    player.sendMessage("§eHold item you want to make bounty for!");

    let runId = system.runInterval(() => {
      const inv = player.getComponent(EntityComponentTypes.Inventory);
      const con = inv?.container;
      
      if (inv && con && player.hasTag("ess:inAuctionSell")) {
        const itemHand = con.getItem(player.selectedSlotIndex);
        if (player.isSneaking && itemHand !== undefined) {
          if (!bannedItems.includes(itemHand.typeId)) {
            bountyBoardPlaceOption(player, itemHand);
          } else {
            player.sendMessage('§cUnable to make a bounty with this item.')
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


export function bountyBoardOwner(player: Player) {
  const bountyBoard = new BountyBoard();
  const bountyData = bountyBoard.getAll();
  const bountyItems: { item: ItemStack; seller: string; data: BountyList }[] = [];

  let form = new ActionFormData()
    .title(`§f§2§2§r§l§0Bounty Board\n§r§2$${formatNumber(new Money().get(getActualName(player.nameTag)))}`);

  for (const bounty of bountyData) {
    if (bounty.nameTag !== getActualName(player.nameTag)) continue;

    for (const entry of bounty.bountyList) {
      const { id, amount, price, completed } = entry;
      const soldItem = Inventories.get(id) as ItemStack | undefined;
      const soldItemEnchantments = soldItem?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments() ?? [];

      if (!soldItem) continue;

      const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId)

      const soldInfo = amount > 1
        ? `x${amount}\n${itemName}`
        : itemName;

      const icon = soldItemEnchantments.length > 0 ? convertTypeIdToAuxIcon(soldItem.typeId, true) : convertTypeIdToAuxIcon(soldItem.typeId);
      const buttonText = `§r${truncateWithDots(soldInfo)}\n§a$${parseFloat(price.toFixed(4))}`;

      form.button(completed ? "§aComplete" : buttonText, icon);
      bountyItems.push({ item: soldItem, seller: bounty.nameTag, data: entry });
    }
  }

  form.show(player).then(res => {
    if (res.canceled || res.selection === undefined) return;
    const selected = bountyItems[res.selection];
    if (!selected) return; // Extra safety check
    
    if (selected.data.completed) {
      let soldItem = Inventories.get(selected.data.id) as ItemStack;
      soldItem.amount = 1;
      for (let i = 0; i < selected.data.amount; i++) {
        player.dimension.spawnItem(soldItem, player.location);
      }

      new BountyBoard().remove(getActualName(player.nameTag), selected.data.id);
      bountyBoardOwner(player);
    } else {
      bountyBoardEdit(player, selected.item, selected.data);
    }
  });
}

function bountyBoardEdit(player: Player, soldItem: ItemStack, bountyList: BountyList) {
  const bountyBoard = new BountyBoard();
  const itemName = soldItem.nameTag !== undefined ? soldItem.nameTag : itemTypeIdToName(soldItem.typeId);

  const form = new ModalFormData()
    .title(`Edit §l${itemName}`)
    .toggle(`Remove ${itemName} from Bounty`)

  form.show(player).then(res => {
    if (!res.formValues || res.canceled) return;

    const remove = res.formValues[0] as boolean;

    if (remove) {
      // player.dimension.spawnItem(soldItem, player.location);
      bountyBoard.remove(getActualName(player.nameTag), bountyList.id);
    } 
  });
}

function bountyBoardPlaceOption(player: Player, itemStack: ItemStack) {
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
    .title(`Place §l${itemName}§r Bounty`)
    .textField('Amount:', 'Type number')
    .textField('Reward:', 'Type number')
    .submitButton(`Place §l${itemName}§r Bounty`);
  form.show(player).then(res => {
    if (res.formValues === undefined) return;
    // console.log(`${getActualName(player.nameTag)} sell ${itemStack.typeId}`)
    let [amount, price] = res.formValues;
    price = parseFloat(price as string);
    amount = parseFloat(amount as string);
    if (!isNaN(price) && !isNaN(amount) && price > 0 && amount > 0 ) {

      const isCanceled = new Money().remove(getActualName(player.nameTag), price);
      if (!isCanceled) {
        let confirm = new MessageFormData()
          .title(`Help wanted §l${itemName}`)
          .body(`You will made a bounty §e${amount}x§r §b${itemName}§r for §e$${price}§r. Are you sure?`)
          .button1('Edit')
          .button2('Create a Bounty')
          .show(player).then(res => {
          if (res.selection === 0) bountyBoardPlaceOption(player, itemStack);
          if (res.selection === 1) {
            // if (amount === itemStack.amount) {
            //   player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, undefined)
            // } else {
            //   let newItemStack = itemStack
            //   newItemStack.amount -= amount;
            //   player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, newItemStack)
            // }
            let soldItem = itemStack;
            soldItem.amount = amount;
            new BountyBoard().add(getActualName(player.nameTag), price, amount, soldItem)
            player.sendMessage(`Successfully made a bounty §e${amount}x§r §b${itemName}§r for §a$${price}§r`);
          }
        });
      } else {
        player.sendMessage(`§cYou don't have enough money! Your money: $${new Money().get(getActualName(player.nameTag)).toFixed(2)}`);
      }
    } else {
      player.sendMessage("§cPlease enter a valid number! Must be greater than zero.");
      player.removeTag("ess:inAuctionUI");
    }
  });
}