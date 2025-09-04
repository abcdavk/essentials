import { system, world } from "@minecraft/server";
import { generateRandomID, getActualName } from "../../utils";
import { QIDB } from "../../QIDB";
let Inventories;
system.run(() => {
    if (world.getDynamicProperty("ess:has_database_init")) {
        Inventories = new QIDB('bounty_board', 10, 270);
    }
});
export function bountyBoardInterval() {
    const BountyData = new BountyBoard().getAll();
    const now = Date.now();
    BountyData.forEach(bounty => {
        bounty.bountyList.forEach(sold => {
            if (now > sold.expire || sold.expire === undefined) {
                console.warn(sold.id);
                new BountyBoard().remove(bounty.nameTag, sold.id);
            }
        });
    });
}
export function bountyBoardSetup(player) {
    if (!world.getDynamicProperty("ess:bounty_board")) {
        world.setDynamicProperty("ess:bounty_board", JSON.stringify([]));
    }
}
export function bountyBoardPlayerSetup(player) {
    player.removeTag("ess:inBountyPlace");
    if (!player.hasTag("ess:bounty_board")) {
        player.addTag("ess:bounty_board");
        new BountyBoard().init(getActualName(player.nameTag));
    }
}
export class BountyBoard {
    constructor() {
        this.moneyProperty = "ess:bounty_board";
    }
    getWorldBountyData() {
        const raw = world.getDynamicProperty(this.moneyProperty);
        // console.warn(raw)
        try {
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    }
    saveWorldBountyData(data) {
        world.setDynamicProperty(this.moneyProperty, JSON.stringify(data));
    }
    init(playerNameTag) {
        const data = this.getWorldBountyData();
        if (!data.find(d => getActualName(d.nameTag) === playerNameTag)) {
            data.push({ nameTag: playerNameTag, bountyList: [] });
            this.saveWorldBountyData(data);
        }
    }
    getAll() {
        return this.getWorldBountyData();
    }
    getAllItems() {
        const allKeys = Inventories.keys();
        let soldItems = [];
        for (let i = 0; i < allKeys.length; i++) {
            soldItems.push(Inventories.get(allKeys[i]));
        }
        return soldItems;
    }
    get(playerNameTag) {
        const playerData = this.getWorldBountyData().find(d => getActualName(d.nameTag) === playerNameTag);
        return playerData?.bountyList ?? [];
    }
    add(playerNameTag, price, amount, itemStack) {
        const now = Date.now();
        const twoWeeks = 13 * 24 * 60 * 60 * 1000;
        const expiredAt = now + twoWeeks;
        const data = this.getWorldBountyData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        const newId = generateRandomID();
        const newbounty = {
            id: newId,
            price,
            amount,
            expire: expiredAt,
            completed: false
        };
        Inventories.set(newId, itemStack);
        data[index].bountyList.push(newbounty);
        this.saveWorldBountyData(data);
    }
    update(playerNameTag, newBountyList, itemStack) {
        const { id, price, amount, expire, completed } = newBountyList;
        this.remove(playerNameTag, id);
        const data = this.getWorldBountyData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        const newbounty = {
            id,
            price,
            amount,
            expire,
            completed
        };
        Inventories.set(id, itemStack);
        data[index].bountyList.push(newbounty);
        this.saveWorldBountyData(data);
    }
    remove(playerNameTag, id) {
        const data = this.getWorldBountyData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        data[index].bountyList = data[index].bountyList.filter(bounty => bounty.id !== id);
        if (Inventories.has(id)) {
            Inventories.delete(id);
        }
        this.saveWorldBountyData(data);
    }
    set(playerNameTag, newBountyList) {
        const data = this.getWorldBountyData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        data[index].bountyList = newBountyList;
        this.saveWorldBountyData(data);
    }
    checkAvailability(playerNameTag, id) {
        const data = this.getWorldBountyData();
        const playerData = data.find(d => getActualName(d.nameTag) === playerNameTag);
        if (!playerData)
            return false;
        return playerData.bountyList.some(bounty => bounty.id === id) && Inventories.has(id);
    }
}
