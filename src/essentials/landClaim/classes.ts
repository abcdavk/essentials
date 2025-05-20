import { world, Player, Block } from "@minecraft/server";
import { ExpiredDate, ProtectionData } from "../../interfaces";
export class Expired {
  private key = "lc:expired";

  private getAllExpiredDate(): ExpiredDate[] {
    const raw = world.getDynamicProperty(this.key) as string;
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ExpiredDate[];
    } catch {
      return [];
    }
  }

  private saveAllExpiredDate(data: ExpiredDate[]) {
    world.setDynamicProperty(this.key, JSON.stringify(data));
  }

  /** Expired 12 days from now */
  init(player: Player, block: Block) {
    const now = Date.now();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const expiredAt = now + twoWeeks;

    const newEntry: ExpiredDate = {
      location: block.location,
      date: expiredAt,
      nameTag: player.nameTag
    };

    const currentData = this.getAllExpiredDate();

    
    const index = currentData.findIndex(entry =>
      entry.location.x === newEntry.location.x &&
      entry.location.y === newEntry.location.y &&
      entry.location.z === newEntry.location.z
    );

    if (index !== -1) {
      currentData[index] = newEntry;
    } else {
      currentData.push(newEntry);
    }

    this.saveAllExpiredDate(currentData);
  }

  /** Update expired date */
  update(player: Player) {
    const now = Date.now();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const newExpireTime = now + twoWeeks;

    const currentData = this.getAllExpiredDate();

    const updatedData = currentData.map(entry => {
      if (entry.nameTag === player.nameTag) {
        return {
          ...entry,
          date: newExpireTime
        };
      }
      return entry;
    });

    this.saveAllExpiredDate(updatedData);
  }


  /** Get all data */
  getAll(): ExpiredDate[] {
    return this.getAllExpiredDate();
  }

  /** Remove expired data */
  removeExpired() {
    const now = Date.now();
    const current = this.getAllExpiredDate();
    const filtered = current.filter(entry => entry.date > now);
    this.saveAllExpiredDate(filtered);
  }

  /** Remove specific expired data */
  remove(block: Block) {
    const current = this.getAllExpiredDate();
    const entry = current.filter(e => {
      return !(e.location.x === block.location.x &&
      e.location.y === block.location.y &&
      e.location.z === block.location.z)
    });
    console.log(`removing expired data: ${JSON.stringify(block.center())}`)
    this.saveAllExpiredDate(entry);
  }

  /** Check location is expired */
  isExpired(block: Block): boolean {
    const now = Date.now();
    const current = this.getAllExpiredDate();
    const entry = current.find(e =>
      e.location.x === block.location.x &&
      e.location.y === block.location.y &&
      e.location.z === block.location.z
    );
    return entry ? entry.date <= now : false;
  }

  /** Get total expired blocks owned by player */
  getPlayerExpiredLength(player: Player): number {
    const currentData = this.getAllExpiredDate();
    return currentData.filter(entry => entry.nameTag === player.nameTag).length;
  }
}

export class Protection {
  private getProtectionData(): ProtectionData[] {
    const rawData = world.getDynamicProperty("lc:protection_data") as string;
    let data = JSON.parse(rawData) as ProtectionData[];
    data = data.filter(d => d && typeof d === "object" && d.nameTag);

    return data;
  }

  debug(player: Player) {
    const data = this.getProtectionData();
    player.sendMessage(`=====================`)
    for (let i = 0; i < data.length; i++) {
      player.sendMessage(`§a${i} - §7${JSON.stringify(data[i])}`);
      // console.log(`§a${i} - §7${JSON.stringify(data[i])}`)
    }
  }

  init(player: Player, block: Block, protectionSize: number) {
    const defaultPlotName = `${player.nameTag}'s plot`
    const protection_data: ProtectionData = {
      nameTag: player.nameTag,
      location: block.center(),
      protectionSize: protectionSize,
      settings: {
        plotName: defaultPlotName,
        showBoundaries: true,
        anti_tnt: false,
        anti_creeper: false,
        anti_arrow: false,
        anti_splash_potion: false,
        anti_hostile: false
      },
      allowList: []
    }

    let data = this.getProtectionData();

    data.push(protection_data);
    world.setDynamicProperty("lc:protection_data", JSON.stringify(data));

    console.log(JSON.stringify(protection_data));
    // this.debug(player);
  }

  remove(block: Block) {
    let data = this.getProtectionData();
    data = data.filter(protectionData => {
      return !(
        protectionData.location.x === block.center().x &&
        protectionData.location.y === block.center().y &&
        protectionData.location.z === block.center().z
      );
    });
    world.setDynamicProperty("lc:protection_data", JSON.stringify(data));
    console.log("removing data: ", JSON.stringify(block.center()))
  }

  get(block: Block) {
    let data = this.getProtectionData();
    data = data.filter(protectionData => {
      return (
        protectionData.location.x === block.center().x &&
        protectionData.location.y === block.center().y &&
        protectionData.location.z === block.center().z
      );
    });
    return data[0];
  }


  getAll(filter?: string) {
    let rawData = this.getProtectionData();
    if (typeof filter === "string") {
      rawData = rawData.filter(data => {
        return (
          data.nameTag === filter
        );
      });
    } 
    
    return rawData;
  }

  set(block: Block, value: ProtectionData) {
    this.remove(block);

    const data = this.getProtectionData();
    data.push(value);
    world.setDynamicProperty("lc:protection_data", JSON.stringify(data));
  }
}