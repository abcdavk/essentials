import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { generateRandomID, getActualName } from "../../utils";
import { QIDB } from "../../QIDB";
import { auctionHouseCatalog, auctionHouseSeller, auctionHouseSellItem } from "./form_ui";
let Inventories;
system.run(() => {
    if (world.getDynamicProperty("ess:has_database_init")) {
        Inventories = new QIDB('auction_house', 10, 270);
    }
});
export function auctionHouseInterval() {
    const auctionData = new AuctionHouse().getAll();
    const now = Date.now();
    auctionData.forEach(auction => {
        auction.auctionList.forEach(sold => {
            if (now > sold.expire || sold.expire === undefined) {
                console.warn(sold.id);
                new AuctionHouse().remove(auction.nameTag, sold.id);
            }
        });
    });
}
export function auctionHouseSetup(player) {
    if (!world.getDynamicProperty("ess:auction_house")) {
        world.setDynamicProperty("ess:auction_house", JSON.stringify([]));
    }
}
export function auctionHousePlayerSetup(player) {
    player.removeTag("ess:inAuctionSell");
    if (!player.hasTag("ess:auction_setup")) {
        player.addTag("ess:auction_setup");
        new AuctionHouse().init(getActualName(player.nameTag));
    }
}
export function auctionHouseMainUI(player) {
    let form = new ActionFormData()
        .title('§f§0§1§r§l§0Select Category')
        .button("Auction House")
        .button("Sell To Auction");
    if (new AuctionHouse().get(getActualName(player.nameTag)).length > 0) {
        form.button("Your Auction");
    }
    form.show(player).then(res => {
        if (res.selection === 0)
            auctionHouseCatalog(player);
        if (res.selection === 1) {
            if (new AuctionHouse().get(getActualName(player.nameTag)).length <= 10) {
                auctionHouseSellItem(player);
            }
            else {
                player.sendMessage('§cMax auction reached!');
            }
        }
        if (res.selection === 2) {
            auctionHouseSeller(player);
        }
    });
}
export class AuctionHouse {
    constructor() {
        this.moneyProperty = "ess:auction_house";
    }
    getWorldAuctionData() {
        const raw = world.getDynamicProperty(this.moneyProperty);
        // console.warn(raw)
        try {
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    }
    saveWorldAuctionData(data) {
        world.setDynamicProperty(this.moneyProperty, JSON.stringify(data));
    }
    init(playerNameTag) {
        const data = this.getWorldAuctionData();
        if (!data.find(d => getActualName(d.nameTag) === playerNameTag)) {
            data.push({ nameTag: playerNameTag, auctionList: [] });
            this.saveWorldAuctionData(data);
        }
    }
    getAll() {
        return this.getWorldAuctionData();
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
        const playerData = this.getWorldAuctionData().find(d => getActualName(d.nameTag) === playerNameTag);
        return playerData?.auctionList ?? [];
    }
    add(playerNameTag, price, amount, itemStack) {
        const now = Date.now();
        const twoWeeks = 13 * 24 * 60 * 60 * 1000;
        const expiredAt = now + twoWeeks;
        const data = this.getWorldAuctionData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        const newId = generateRandomID();
        const newAuction = {
            id: newId,
            price,
            amount,
            expire: expiredAt
        };
        console.log("test");
        Inventories.set(newId, itemStack);
        data[index].auctionList.push(newAuction);
        this.saveWorldAuctionData(data);
    }
    remove(playerNameTag, id) {
        const data = this.getWorldAuctionData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        data[index].auctionList = data[index].auctionList.filter(auction => auction.id !== id);
        if (Inventories.has(id)) {
            Inventories.delete(id);
        }
        this.saveWorldAuctionData(data);
    }
    set(playerNameTag, newAuctionList) {
        const data = this.getWorldAuctionData();
        const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);
        if (index === -1)
            return;
        data[index].auctionList = newAuctionList;
        this.saveWorldAuctionData(data);
    }
    checkAvailability(playerNameTag, id) {
        const data = this.getWorldAuctionData();
        const playerData = data.find(d => getActualName(d.nameTag) === playerNameTag);
        if (!playerData)
            return false;
        return playerData.auctionList.some(auction => auction.id === id) && Inventories.has(id);
    }
}
