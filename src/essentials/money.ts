import { Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { getActualName } from "../utils";

export type MoneyData = {
  nameTag: string;
  value: number;
};

export function moneySetup() {
  if (!world.getDynamicProperty("ess:money")) {
    world.setDynamicProperty("ess:money", JSON.stringify([]));
  }
}

export function playerSendMoney(player: Player) {
  const players = world.getPlayers();
  const moneyData = new Money();
  const currentMoney = moneyData.get(getActualName(player.nameTag));
  const playerList: string[] = ["None"];

  players.forEach(p => {
    if (getActualName(p.nameTag) !== getActualName(player.nameTag)) {
      playerList.push(getActualName(p.nameTag));
    }
  });

  const form = new ModalFormData()
    .title("Send Money")
    .label(`Your money: §a$${currentMoney}`)
    .dropdown("Select Online Player:", playerList, { defaultValueIndex: 0 })
    .textField("Or type player username", "Type here", { tooltip: "Type manually if the player is not in the dropdown/offline" })
    .textField("Amount to send:", "0", { defaultValue: `0` });

  form.show(player).then(res => {
    if (!res.formValues || res.canceled) return;

    const [label, dropdownIndex, typedName, amountStr] = res.formValues as [string, number, string, string];

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      player.sendMessage("§cInvalid amount.");
      return;
    }

    const usingDropdown = dropdownIndex !== 0;
    const usingTypedName = typedName !== "";

    if (usingDropdown && usingTypedName) {
      player.sendMessage("§cPlease only use either the dropdown or the typed name, not both.");
      return;
    }

    let targetName = "";

    if (usingDropdown) {
      targetName = playerList[dropdownIndex];
    } else if (usingTypedName) {
      targetName = typedName.trim();
    } else {
      player.sendMessage("§cPlease select or type a player's name.");
      return;
    }

    if (targetName === getActualName(player.nameTag)) {
      player.sendMessage("§cYou can't send money to yourself.");
      return;
    }

    if (currentMoney < amount) {
      player.sendMessage("§cYou don't have enough money.");
      return;
    }

    moneyData.remove(getActualName(player.nameTag), amount);
    moneyData.add(targetName, amount);
    player.runCommand(`tellraw ${targetName} {"rawtext":[{"text":"§b${getActualName(player.nameTag)}§r sent you §a$${amount}"}]}`)
    player.sendMessage(`Sent §a$${amount}§r to §b${targetName}`);
  });
}


export class Money {
  private moneyProperty = "ess:money";

  private getWorldMoneyData(): MoneyData[] {
    const rawData = world.getDynamicProperty(this.moneyProperty) as string;
    return JSON.parse(rawData) as MoneyData[];
  }

  /** Player initialization to world money */
  init(playerNameTag: string) {
    const worldMoneyData = this.getWorldMoneyData();

    if (worldMoneyData.find((data) => data.nameTag === playerNameTag)) return;

    worldMoneyData.push({ nameTag: playerNameTag, value: 0 });
    world.setDynamicProperty(this.moneyProperty, JSON.stringify(worldMoneyData));
  }

  /** Get player money */
  get(playerNameTag: string): number {
    const player = this.getWorldMoneyData().find((data) => data.nameTag === playerNameTag);
    return player?.value ?? 0;
  }

  /** Set player money directly */
  set(playerNameTag: string, newValue: number) {
    const worldMoneyData = this.getWorldMoneyData()
      .filter((data) => data.nameTag !== playerNameTag); 

    worldMoneyData.push({ nameTag: playerNameTag, value: parseFloat(newValue.toFixed(4)) });
    world.setDynamicProperty(this.moneyProperty, JSON.stringify(worldMoneyData));
  }

  /** Add player money */
  add(playerNameTag: string, amount: number) {
    const current = this.get(playerNameTag);
    this.set(playerNameTag, current + amount);
  }

  /**
   * Remove player money 
   * @returns true if cancel (player doesn't have enough money)
   */
  remove(playerNameTag: string, amount: number): boolean {
    const current = this.get(playerNameTag);

    if (current < amount) {
      return true;
    }

    this.set(playerNameTag, current - amount);
    return false; 
  }
}