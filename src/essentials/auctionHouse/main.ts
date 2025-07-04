import { ItemStack, Player, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { generateRandomID } from "../../utils";
import { QIDB } from "../../QIDB";
import { auctionHouseCatalog, auctionHouseSeller, auctionHouseSellItem } from "./form_ui";
import { AuctionData, AuctionSold } from "../../interfaces";

let Inventories: QIDB

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
        console.warn(sold.id)
        new AuctionHouse().remove(auction.nameTag, sold.id);
      }
    })
  });
}

export function auctionHouseSetup(player: Player) {
  if (!world.getDynamicProperty("ess:auction_house")) {
    world.setDynamicProperty("ess:auction_house", JSON.stringify([]));
  }
}

export function auctionHousePlayerSetup(player: Player) {
  player.removeTag("ess:inAuctionSell");
  if (!player.hasTag("ess:auction_setup")) {
    player.addTag("ess:auction_setup");
    new AuctionHouse().init(player.nameTag)
  }
}

export function auctionHouseMainUI(player: Player) {
  let form = new ActionFormData()
    .title('§f§0§1§r§l§0Select Category')
    .button("Auction House")
    .button("Sell To Auction");
    if (new AuctionHouse().get(player.nameTag).length > 0) {
      form.button("Your Auction");
    }
  form.show(player).then(res => {
    if (res.selection === 0) auctionHouseCatalog(player);
    if (res.selection === 1) {
      if (new AuctionHouse().get(player.nameTag).length <= 10) {
        auctionHouseSellItem(player);
      } else {
        player.sendMessage('§cMax auction reached!');
      }
    }
    if (res.selection === 2) {
      auctionHouseSeller(player);
    }
  });
}


export class AuctionHouse {
  private moneyProperty = "ess:auction_house";

  private getWorldAuctionData(): AuctionData[] {
    const raw = world.getDynamicProperty(this.moneyProperty) as string;
    // console.warn(raw)
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveWorldAuctionData(data: AuctionData[]) {
    world.setDynamicProperty(this.moneyProperty, JSON.stringify(data));
  }

  init(playerNameTag: string) {
    const data = this.getWorldAuctionData();
    if (!data.find(d => d.nameTag === playerNameTag)) {
      data.push({ nameTag: playerNameTag, auctionList: [] });
      this.saveWorldAuctionData(data);
    }
  }

  getAll(): AuctionData[] {
    return this.getWorldAuctionData();
  }

  getAllItems() {
    const allKeys = Inventories.keys();
    let soldItems: ItemStack[] = [];
    for (let i = 0; i < allKeys.length; i++) {
      soldItems.push(Inventories.get(allKeys[i]) as ItemStack);
    }
    return soldItems;
  }

  get(playerNameTag: string): AuctionSold[] {
    const playerData = this.getWorldAuctionData().find(d => d.nameTag === playerNameTag);
    return playerData?.auctionList ?? [];
  }

  add(playerNameTag: string, price: number, amount: number, itemStack: ItemStack) {
    const now = Date.now();
    const twoWeeks = 13 * 24 * 60 * 60 * 1000;
    const expiredAt = now + twoWeeks;
    const data = this.getWorldAuctionData();
    const index = data.findIndex(d => d.nameTag === playerNameTag);
    if (index === -1) return;

    const newId = generateRandomID();
    const newAuction: AuctionSold = {
      id: newId,
      price,
      amount,
      expire: expiredAt
    };

    console.log("test")

    Inventories.set(newId, itemStack);

    data[index].auctionList.push(newAuction);
    this.saveWorldAuctionData(data);
  }

  remove(playerNameTag: string, id: string) {
    const data = this.getWorldAuctionData();
    const index = data.findIndex(d => d.nameTag === playerNameTag);
    if (index === -1) return;

    data[index].auctionList = data[index].auctionList.filter(auction => auction.id !== id);

    if (Inventories.has(id)) {
      Inventories.delete(id);
    }

    this.saveWorldAuctionData(data);
  }

  set(playerNameTag: string, newAuctionList: AuctionSold[]) {
    const data = this.getWorldAuctionData();
    const index = data.findIndex(d => d.nameTag === playerNameTag);
    if (index === -1) return;

    data[index].auctionList = newAuctionList;
    this.saveWorldAuctionData(data);
  }

  checkAvailability(playerNameTag: string, id: string): boolean {
    const data = this.getWorldAuctionData();
    const playerData = data.find(d => d.nameTag === playerNameTag);
    if (!playerData) return false;

    return playerData.auctionList.some(auction => auction.id === id) && Inventories.has(id);
  }
}