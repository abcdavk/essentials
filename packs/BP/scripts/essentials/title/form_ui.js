import { ActionFormData } from "@minecraft/server-ui";
import { TitleData } from "./main";
import { titleRegistry } from "./config";
export function changeTitleMenu(player) {
    const titleOwned = new TitleData().getArray(player.nameTag);
    let titleUsed = new TitleData().get(player.nameTag);
    titleUsed = titleUsed === "" ? "" : `§l${titleRegistry.filter(title => title.name === titleUsed)[0].color}${titleUsed}§r `;
    let form = new ActionFormData()
        .title(`§f§3§1§r§l§0Titles`)
        .body(`${titleUsed}${player.nameTag}\n\n\n\n`);
    for (let i = 0; i < titleOwned.length; i++) {
        form.button(`§r§l${titleRegistry.filter(title => title.name === titleOwned[i])[0].color}${titleOwned[i]}`);
    }
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        new TitleData().set(player.nameTag, titleOwned[res.selection]);
        changeTitleMenu(player);
    });
}
