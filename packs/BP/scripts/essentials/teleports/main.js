import { system, world } from "@minecraft/server";
export function teleportSetup() {
    if (!world.getDynamicProperty("ess:ac_teleport")) {
        world.setDynamicProperty("ess:ac_teleport", JSON.stringify([]));
    }
}
export function teleportPlayerSetup(player) {
    if (!player.hasTag("ess:tp_setup")) {
        new ACTeleport().init(player.nameTag);
    }
}
export function teleportSpawn(player) {
    if (!player.hasTag("ess:tp_cooldown")) {
        player.addTag("ess:tp_cooldown");
        player.teleport({ x: 0, y: 64, z: 0 });
        system.runTimeout(() => {
            player.removeTag("ess:tp_cooldown");
        }, 20 * 10);
    }
    else {
        player.sendMessage("§cTeleport is cooldown.");
    }
}
export function teleportRandom(player) {
    if (!player.hasTag("ess:tp_cooldown")) {
        player.addTag("ess:tp_cooldown");
        const randomLoc = {
            x: Math.floor(Math.random() * 100000),
            y: 72,
            z: Math.floor(Math.random() * 100000),
        };
        console.warn(player.tryTeleport(randomLoc));
        system.runTimeout(() => {
            player.removeTag("ess:tp_cooldown");
        }, 20 * 30);
    }
    else {
        player.sendMessage("§cTeleport is cooldown.");
    }
}
export class ACTeleport {
    constructor() {
        this.acProperty = "ess:ac_teleport";
    }
    getWorldAuctionData() {
        const raw = world.getDynamicProperty(this.acProperty);
        try {
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    }
    saveWorldAuctionData(data) {
        world.setDynamicProperty(this.acProperty, JSON.stringify(data));
    }
    init(playerNameTag) {
        const data = this.getWorldAuctionData();
        if (!data.find(d => d.nameTag === playerNameTag)) {
            data.push({ nameTag: playerNameTag, requestList: [] });
            this.saveWorldAuctionData(data);
        }
    }
    set(playerNameTag, requestList) {
        const data = this.getWorldAuctionData();
        const index = data.findIndex(d => d.nameTag === playerNameTag);
        if (index !== -1) {
            data[index].requestList = requestList;
        }
        else {
            data.push({ nameTag: playerNameTag, requestList });
        }
        this.saveWorldAuctionData(data);
    }
    get(playerNameTag) {
        const data = this.getWorldAuctionData();
        const found = data.find(d => d.nameTag === playerNameTag);
        return found?.requestList ?? [];
    }
    add(playerNameTag, request) {
        const data = this.getWorldAuctionData();
        let playerData = data.find(d => d.nameTag === playerNameTag);
        if (!playerData) {
            playerData = { nameTag: playerNameTag, requestList: [] };
            data.push(playerData);
        }
        const exists = playerData.requestList.find(r => r.nameTag === request.nameTag &&
            r.location.x === request.location.x &&
            r.location.y === request.location.y &&
            r.location.z === request.location.z);
        if (!exists) {
            playerData.requestList.push(request);
            this.saveWorldAuctionData(data);
        }
    }
    remove(playerNameTag, target) {
        const data = this.getWorldAuctionData();
        const playerData = data.find(d => d.nameTag === playerNameTag);
        if (playerData) {
            playerData.requestList = playerData.requestList.filter(r => !(r.nameTag === target.nameTag &&
                r.location.x === target.location.x &&
                r.location.y === target.location.y &&
                r.location.z === target.location.z));
            this.saveWorldAuctionData(data);
        }
    }
}
