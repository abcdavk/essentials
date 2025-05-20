import { ActionFormData } from "@minecraft/server-ui";
import { jobMenuMainUI } from "./essentials/jobMenu/form_ui";
export function hubMenu(player, itemStack) {
    if (itemStack.typeId === "minecraft:compass") {
        let form = new ActionFormData()
            .title('§f§2§0§r§l§0Hub Menu')
            .button('', 'textures/ui/new_ui/M1')
            .button('', 'textures/ui/new_ui/M2')
            .button('', 'textures/ui/new_ui/M3')
            .button('', 'textures/ui/new_ui/M4');
        form.show(player).then(res => {
            if (res.selection === 2) {
                jobMenuMainUI(player);
            }
            if (res.selection === 3) {
                hubSettings(player);
            }
        });
    }
}
function hubSettings(player) {
    let form = new ActionFormData()
        .title('§f§2§1§r§l§0Settings')
        .button('', 'textures/ui/new_ui/settings/E1')
        .button('', 'textures/ui/new_ui/settings/E2');
    form.show(player).then(res => {
        if (res.selection === 0) {
            if (player.hasTag("deny_attack_player")) {
                player.removeTag("deny_attack_player");
                player.sendMessage("§cToggle PVP disabled");
            }
            else {
                player.addTag("deny_attack_player");
                player.sendMessage("§aToggle PVP enabled");
            }
        }
    });
}
