import { ChatSendBeforeEvent, Player, world } from "@minecraft/server";
import { titleRegistry } from "./config";
import { getActualName } from "../../utils";

export function titleSetup() {
  if (!world.getDynamicProperty("ess:title")) {
    world.setDynamicProperty("ess:title", JSON.stringify([]));
  }
}

export function playerTitleSetup(player: Player) {
  if (!player.hasTag("ess:title_setup")) {
    new TitleData().init(getActualName(player.nameTag));
    player.addTag("ess:title_setup");
  }
}

export function titleOnChat(data: ChatSendBeforeEvent) {
  let { message, sender: player } = data;
  let titleUsed = new TitleData().get(getActualName(player.nameTag))
  if (titleUsed !== "") {
    data.cancel = true;
    const color = titleRegistry.filter(title => title.name === titleUsed)[0].color;
    world.sendMessage(`<§l${color}${titleUsed}§r ${getActualName(player.nameTag)}>§r ${message}`)
  }
}

type TitleDataInterface = {
  nameTag: string;
  enabled: string;
  titleList: string[];
};

export class TitleData {
  private titleProperty = "ess:title";

  private getTitlesData(): TitleDataInterface[] {
    const rawData = world.getDynamicProperty(this.titleProperty) as string;
    try {
      return JSON.parse(rawData) as TitleDataInterface[];
    } catch {
      return [];
    }
  }

  private saveTitlesData(data: TitleDataInterface[]) {
    world.setDynamicProperty(this.titleProperty, JSON.stringify(data));
  }

  init(playerNameTag: string) {
    const data = this.getTitlesData();
    if (data.find((d) => getActualName(d.nameTag) === playerNameTag)) return;
    data.push({ nameTag: playerNameTag, enabled: "", titleList: [] });
    this.saveTitlesData(data);
  }

  get(playerNameTag: string): string {
    const playerData = this.getTitlesData().find((d) => getActualName(d.nameTag) === playerNameTag);
    return playerData?.enabled ?? "";
  }

  getArray(playerNameTag: string): string[] {
    const playerData = this.getTitlesData().find((d) => getActualName(d.nameTag) === playerNameTag);
    return playerData?.titleList ?? [];
  }

  set(playerNameTag: string, titleToSet: string) {
    const data = this.getTitlesData();
    const index = data.findIndex((d) => getActualName(d.nameTag) === playerNameTag);
    if (index === -1) return;

    data[index].enabled = titleToSet;
    this.saveTitlesData(data);
  }

  add(playerNameTag: string, titleToAdd: string) {
    const data = this.getTitlesData();
    const index = data.findIndex((d) => getActualName(d.nameTag) === playerNameTag);
    if (index === -1) return;

    if (!data[index].titleList.includes(titleToAdd)) {
      data[index].titleList.push(titleToAdd);
      this.saveTitlesData(data);
    }
  }
}
