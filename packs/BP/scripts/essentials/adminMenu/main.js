import { EntityComponentTypes, EquipmentSlot } from "@minecraft/server";
import { adminMenuMainUI } from "./form_ui";
export function adminMenuInterval(dimension) {
    dimension.getEntities({
        type: "minecraft:item"
    }).forEach(item => {
        if (item && item.getComponent(EntityComponentTypes.Item)?.typeId === "dave:admin_menu")
            return;
        item.remove();
    });
}
export function adminMenu(player, itemStack) {
    if (player.isOp()) {
        if (itemStack.typeId !== "dave:admin_menu")
            return;
        adminMenuMainUI(player);
    }
    else {
        player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, undefined);
    }
}
