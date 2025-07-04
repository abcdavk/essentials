import { world } from "@minecraft/server";
export class Expired {
    constructor() {
        this.key = "lc:expired";
    }
    getAllExpiredDate() {
        const raw = world.getDynamicProperty(this.key);
        if (!raw)
            return [];
        try {
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    saveAllExpiredDate(data) {
        world.setDynamicProperty(this.key, JSON.stringify(data));
    }
    /** Expired 12 days from now */
    init(playerName, blockLoc) {
        const now = Date.now();
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        const expiredAt = now + twoWeeks;
        const newEntry = {
            location: blockLoc,
            date: expiredAt,
            nameTag: playerName
        };
        const currentData = this.getAllExpiredDate();
        const index = currentData.findIndex(entry => entry.location.x === newEntry.location.x &&
            entry.location.y === newEntry.location.y &&
            entry.location.z === newEntry.location.z);
        if (index !== -1) {
            currentData[index] = newEntry;
        }
        else {
            currentData.push(newEntry);
        }
        this.saveAllExpiredDate(currentData);
    }
    /** Update expired date */
    update(playerName) {
        const now = Date.now();
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        const newExpireTime = now + twoWeeks;
        const currentData = this.getAllExpiredDate();
        const updatedData = currentData.map(entry => {
            if (entry.nameTag === playerName) {
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
    getAll() {
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
    remove(blockLoc) {
        const current = this.getAllExpiredDate();
        const entry = current.filter(e => {
            return !(e.location.x === blockLoc.x &&
                e.location.y === blockLoc.y &&
                e.location.z === blockLoc.z);
        });
        console.log(`removing expired data: ${JSON.stringify(blockLoc)}`);
        this.saveAllExpiredDate(entry);
    }
    /** Check location is expired */
    isExpired(blockLoc) {
        const now = Date.now();
        const current = this.getAllExpiredDate();
        const entry = current.find(e => e.location.x === blockLoc.x &&
            e.location.y === blockLoc.y &&
            e.location.z === blockLoc.z);
        return entry ? entry.date <= now : false;
    }
    /** Get total expired blocks owned by player */
    getPlayerExpiredLength(playerName) {
        const currentData = this.getAllExpiredDate();
        return currentData.filter(entry => entry.nameTag === playerName).length;
    }
}
export class Protection {
    getProtectionData() {
        const rawData = world.getDynamicProperty("lc:protection_data");
        let data = JSON.parse(rawData);
        data = data.filter(d => d && typeof d === "object" && d.nameTag);
        return data;
    }
    // debug(playerName: string) {
    //   const data = this.getProtectionData();
    //   player.sendMessage(`=====================`)
    //   for (let i = 0; i < data.length; i++) {
    //     player.sendMessage(`§a${i} - §7${JSON.stringify(data[i])}`);
    //     // console.log(`§a${i} - §7${JSON.stringify(data[i])}`)
    //   }
    // }
    init(playerName, blockLoc, protectionSize, id) {
        const defaultPlotName = `${playerName}'s plot`;
        const protection_data = {
            id,
            nameTag: playerName,
            location: blockLoc,
            protectionSize: protectionSize,
            isSell: false,
            sellPrice: 0,
            settings: {
                plotName: defaultPlotName,
                showBoundaries: true,
                anti_tnt: false,
                anti_minecart_tnt: false,
                anti_creeper: false,
                anti_arrow: false,
                anti_splash_potion: false,
                anti_hostile: false,
                anti_fireball: false,
                anti_wind_charge: false,
                anti_end_crystal: false
            },
            allowList: []
        };
        let data = this.getProtectionData();
        data.push(protection_data);
        world.setDynamicProperty("lc:protection_data", JSON.stringify(data));
        console.log(JSON.stringify(protection_data));
        // this.debug(player);
    }
    remove(blockLoc) {
        let data = this.getProtectionData();
        data = data.filter(protectionData => {
            return !(protectionData.location.x === blockLoc.x &&
                protectionData.location.y === blockLoc.y &&
                protectionData.location.z === blockLoc.z);
        });
        world.setDynamicProperty("lc:protection_data", JSON.stringify(data));
        console.log("removing data: ", JSON.stringify(blockLoc));
    }
    get(blockLoc) {
        let data = this.getProtectionData();
        data = data.filter(protectionData => {
            return (protectionData.location.x === blockLoc.x &&
                protectionData.location.y === blockLoc.y &&
                protectionData.location.z === blockLoc.z);
        });
        return data[0];
    }
    getById(id) {
        let data = this.getProtectionData();
        data = data.filter(protectionData => {
            return (protectionData.id === id);
        });
        return data[0];
    }
    getAll(filter) {
        let rawData = this.getProtectionData();
        if (typeof filter === "string") {
            rawData = rawData.filter(data => {
                return (data.nameTag === filter);
            });
        }
        return rawData;
    }
    getByPermission(permission, playerName) {
        const data = this.getProtectionData();
        return data.filter(protection => {
            return protection.allowList.some(entry => {
                const hasPermission = entry[permission];
                const isMatchingPlayer = playerName ? entry.nameTag === playerName : true;
                return hasPermission === true && isMatchingPlayer;
            });
        });
    }
    set(blockLoc, value) {
        this.remove(blockLoc);
        const data = this.getProtectionData();
        data.push(value);
        world.setDynamicProperty("lc:protection_data", JSON.stringify(data));
    }
}
