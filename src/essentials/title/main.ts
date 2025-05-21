import { world } from "@minecraft/server";

export function titleSetup() {
  if (!world.getDynamicProperty("ess:title")) {
    world.setDynamicProperty("ess:title", JSON.stringify([]));
  }
}

type TitleDataInterface = {
  nameTag: string;
  enabled: string;
  titleList: string[]
}

export class TitleData {
  private titleProperty = "ess:title"

  private getTitlesData(): TitleDataInterface[] {
    const rawData = world.getDynamicProperty(this.titleProperty) as string;
    return JSON.parse(rawData) as TitleDataInterface[];
  }

  init(playerNameTag: string) {
    const worldTitlesData = this.getTitlesData();

    if (worldTitlesData.find((data) => data.nameTag === playerNameTag)) return;

    worldTitlesData.push({ nameTag: playerNameTag, enabled: "", titleList: [] });
    world.setDynamicProperty(this.titleProperty, JSON.stringify(worldTitlesData));
  }

  get(playerNameTag: string): string {
    const player = this.getTitlesData().find((data) => data.nameTag === playerNameTag);
    return player?.enabled ?? "";
  }

  getArray(playerNameTag: string): string[] {
    let worldTitlesData = this.getTitlesData();
    worldTitlesData.filter((data) => data.nameTag === playerNameTag); 
    return worldTitlesData[0].titleList
  }

  set(playerNameTag: string, titleToSet: string) {
    let worldTitlesData = this.getTitlesData();
    worldTitlesData.filter((data) => data.nameTag !== playerNameTag); 
    
    worldTitlesData.push({ nameTag: playerNameTag, enabled: titleToSet, titleList: this.getArray(playerNameTag) });
    world.setDynamicProperty(this.titleProperty, JSON.stringify(worldTitlesData));
  }

  add(playerNameTag: string, titleToAdd: string) {
    let titleArray = this.getArray(playerNameTag);
    let worldTitlesData = this.getTitlesData();
    worldTitlesData.filter((data) => data.nameTag !== playerNameTag); 
    titleArray.push(titleToAdd);
    worldTitlesData.push({ nameTag: playerNameTag, enabled: this.get(playerNameTag), titleList: titleArray });
    world.setDynamicProperty(this.titleProperty, JSON.stringify(worldTitlesData));
  }
}