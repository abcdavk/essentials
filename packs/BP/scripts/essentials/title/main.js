import { world } from "@minecraft/server";
import { titleRegistry } from "./config";
import { getActualName } from "../../utils";
export function titleSetup() {
    if (!world.getDynamicProperty("ess:title")) {
        world.setDynamicProperty("ess:title", JSON.stringify([]));
    }
}
export function playerTitleSetup(player) {
    if (!player.hasTag("ess:title_setup")) {
        new TitleData().init(getActualName(player.nameTag));
        player.addTag("ess:title_setup");
    }
}
export function titleOnChat(data) {
    let { message, sender: player } = data;
    let titleUsed = new TitleData().get(getActualName(player.nameTag));
    if (titleUsed !== "") {
        data.cancel = true;
        const color = titleRegistry.filter(title => title.name === titleUsed)[0].color;
        world.sendMessage(`<§l${color}${titleUsed}§r ${getActualName(player.nameTag)}>§r ${message}`);
    }
}
export class TitleData {
    constructor() {
        this.titleProperty = "ess:title";
    }
    getTitlesData() {
        const rawData = world.getDynamicProperty(this.titleProperty);
        try {
            return JSON.parse(rawData);
        }
        catch {
            return [];
        }
    }
    saveTitlesData(data) {
        world.setDynamicProperty(this.titleProperty, JSON.stringify(data));
    }
    init(playerNameTag) {
        const data = this.getTitlesData();
        if (data.find((d) => getActualName(d.nameTag) === playerNameTag))
            return;
        data.push({ nameTag: playerNameTag, enabled: "", titleList: [] });
        this.saveTitlesData(data);
    }
    get(playerNameTag) {
        const playerData = this.getTitlesData().find((d) => getActualName(d.nameTag) === playerNameTag);
        return playerData?.enabled ?? "";
    }
    getArray(playerNameTag) {
        const playerData = this.getTitlesData().find((d) => getActualName(d.nameTag) === playerNameTag);
        return playerData?.titleList ?? [];
    }
    set(playerNameTag, titleToSet) {
        const data = this.getTitlesData();
        const index = data.findIndex((d) => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        data[index].enabled = titleToSet;
        this.saveTitlesData(data);
    }
    add(playerNameTag, titleToAdd) {
        const data = this.getTitlesData();
        const index = data.findIndex((d) => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        if (!data[index].titleList.includes(titleToAdd)) {
            data[index].titleList.push(titleToAdd);
            this.saveTitlesData(data);
        }
    }
}
