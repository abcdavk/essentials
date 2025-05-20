import { Dimension, EntityComponentTypes, EquipmentSlot, ItemStack, Player } from "@minecraft/server";
import { adminMenuMainUI } from "./form_ui";

export function adminMenuInterval(dimension: Dimension) {
  dimension.getEntities({
    type: "minecraft:item"
  }).forEach(item => {
    if (item && item.getComponent(EntityComponentTypes.Item)?.typeId === "dave:admin_menu") return;
    item.remove();
  });
}

export function adminMenu(player: Player, itemStack: ItemStack) {
  if (player.isOp()) {
    if (itemStack.typeId !== "dave:admin_menu") return;
    adminMenuMainUI(player);
  } else {
    player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, undefined);
  }
}