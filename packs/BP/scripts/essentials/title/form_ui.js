import { ActionFormData } from "@minecraft/server-ui";
import { TitleData } from "./main";
import { titleRegistry } from "./config";
import { getActualName } from "../../utils";
export function changeTitleMenu(player) {
    const titleOwned = new TitleData().getArray(getActualName(player.nameTag));
    let titleUsed = new TitleData().get(getActualName(player.nameTag));
    titleUsed = titleUsed === "" ? "" : `§l${titleRegistry.filter(title => title.name === titleUsed)[0].color}${titleUsed}§r `;
    let form = new ActionFormData()
        .title(`§f§3§1§r§l§0Titles`)
        .body(`${titleUsed}${getActualName(player.nameTag)}\n\n\n\n`)
        .button("Hide Title");
    for (let i = 0; i < titleOwned.length; i++) {
        form.button(`§r§l${titleRegistry.filter(title => title.name === titleOwned[i])[0].color}${titleOwned[i]}`);
    }
    form.show(player).then(res => {
        if (res.selection === undefined)
            return;
        if (res.selection === 0) {
            new TitleData().set(getActualName(player.nameTag), "");
            changeTitleMenu(player);
        }
        else if (res.selection > 0) {
            let titleSelected = titleOwned[res.selection - 1];
            new TitleData().set(getActualName(player.nameTag), titleSelected);
            changeTitleMenu(player);
        }
    });
}
