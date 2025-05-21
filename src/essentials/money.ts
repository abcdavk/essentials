import { world } from "@minecraft/server";

export type MoneyData = {
  nameTag: string;
  value: number;
};

export function moneySetup() {
  if (!world.getDynamicProperty("ess:money")) {
    world.setDynamicProperty("ess:money", JSON.stringify([]));
  }
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