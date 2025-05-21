import { world } from "@minecraft/server";
export function titleSetup() {
    if (!world.getDynamicProperty("ess:title")) {
        world.setDynamicProperty("ess:title", JSON.stringify([]));
    }
}
export function playerTitleSetup(player) {
    if (!player.hasTag("ess:title_setup")) {
        new TitleData().init(player.nameTag);
        player.addTag("ess:title_setup");
    }
}
export class TitleData {
    constructor() {
        this.titleProperty = "ess:title";
    }
    getTitlesData() {
        const rawData = world.getDynamicProperty(this.titleProperty);
        return JSON.parse(rawData);
    }
    init(playerNameTag) {
        const worldTitlesData = this.getTitlesData();
        if (worldTitlesData.find((data) => data.nameTag === playerNameTag))
            return;
        worldTitlesData.push({ nameTag: playerNameTag, enabled: "", titleList: [] });
        world.setDynamicProperty(this.titleProperty, JSON.stringify(worldTitlesData));
    }
    get(playerNameTag) {
        const player = this.getTitlesData().find((data) => data.nameTag === playerNameTag);
        return player?.enabled ?? "";
    }
    getArray(playerNameTag) {
        let worldTitlesData = this.getTitlesData();
        worldTitlesData.filter((data) => data.nameTag === playerNameTag);
        return worldTitlesData[0].titleList;
    }
    set(playerNameTag, titleToSet) {
        let worldTitlesData = this.getTitlesData();
        worldTitlesData.filter((data) => data.nameTag !== playerNameTag);
        worldTitlesData.push({ nameTag: playerNameTag, enabled: titleToSet, titleList: this.getArray(playerNameTag) });
        world.setDynamicProperty(this.titleProperty, JSON.stringify(worldTitlesData));
    }
    add(playerNameTag, titleToAdd) {
        let titleArray = this.getArray(playerNameTag);
        let worldTitlesData = this.getTitlesData();
        worldTitlesData.filter((data) => data.nameTag !== playerNameTag);
        titleArray.push(titleToAdd);
        worldTitlesData.push({ nameTag: playerNameTag, enabled: this.get(playerNameTag), titleList: titleArray });
        world.setDynamicProperty(this.titleProperty, JSON.stringify(worldTitlesData));
    }
}
