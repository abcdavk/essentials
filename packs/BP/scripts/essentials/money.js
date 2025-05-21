import { world } from "@minecraft/server";
export function moneySetup() {
    if (!world.getDynamicProperty("ess:money")) {
        world.setDynamicProperty("ess:money", JSON.stringify([]));
    }
}
export class Money {
    constructor() {
        this.moneyProperty = "ess:money";
    }
    getWorldMoneyData() {
        const rawData = world.getDynamicProperty(this.moneyProperty);
        return JSON.parse(rawData);
    }
    /** Player initialization to world money */
    init(playerNameTag) {
        const worldMoneyData = this.getWorldMoneyData();
        if (worldMoneyData.find((data) => data.nameTag === playerNameTag))
            return;
        worldMoneyData.push({ nameTag: playerNameTag, value: 0 });
        world.setDynamicProperty(this.moneyProperty, JSON.stringify(worldMoneyData));
    }
    /** Get player money */
    get(playerNameTag) {
        const player = this.getWorldMoneyData().find((data) => data.nameTag === playerNameTag);
        return player?.value ?? 0;
    }
    /** Set player money directly */
    set(playerNameTag, newValue) {
        const worldMoneyData = this.getWorldMoneyData()
            .filter((data) => data.nameTag !== playerNameTag);
        worldMoneyData.push({ nameTag: playerNameTag, value: parseFloat(newValue.toFixed(4)) });
        world.setDynamicProperty(this.moneyProperty, JSON.stringify(worldMoneyData));
    }
    /** Add player money */
    add(playerNameTag, amount) {
        const current = this.get(playerNameTag);
        this.set(playerNameTag, current + amount);
    }
    /**
     * Remove player money
     * @returns true if cancel (player doesn't have enough money)
     */
    remove(playerNameTag, amount) {
        const current = this.get(playerNameTag);
        if (current < amount) {
            return true;
        }
        this.set(playerNameTag, current - amount);
        return false;
    }
}
