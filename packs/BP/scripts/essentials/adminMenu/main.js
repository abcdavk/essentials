import { CommandPermissionLevel, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";
import { adminMenuMainUI } from "./form_ui";
export function adminMenu(player, itemStack) {
    if (itemStack.typeId !== "dave:admin_menu")
        return;
    if (player.commandPermissionLevel >= CommandPermissionLevel.Admin) {
        adminMenuMainUI(player);
    }
    else {
        player.getComponent(EntityComponentTypes.Equippable)?.setEquipment(EquipmentSlot.Mainhand, undefined);
    }
}
