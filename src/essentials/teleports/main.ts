import { Player, system, Vector3, world } from "@minecraft/server";
import { getActualName } from "../../utils";

export function teleportSetup() {
  if (!world.getDynamicProperty("ess:ac_teleport")) {
    world.setDynamicProperty("ess:ac_teleport", JSON.stringify([]));
  }
}

export function teleportPlayerSetup(player: Player) {
  if (!player.hasTag("ess:tp_setup")) {
    new ACTeleport().init(getActualName(player.nameTag));
  }
}

export function teleportSpawn(player: Player) {
  if (!player.hasTag("ess:tp_cooldown")) {
    player.addTag("ess:tp_cooldown");
    player.teleport({ x: 0, y: 64, z: 0 });
    system.runTimeout(() => {
      player.removeTag("ess:tp_cooldown")
    }, 20 * 10);
  } else {
    player.sendMessage("§cTeleport is cooldown.")
  }
}

export function teleportRandom(player: Player) {
  if (!player.hasTag("ess:tp_cooldown")) {
    player.addTag("ess:tp_cooldown");
    const randomLoc: Vector3 = {
      x: Math.floor(Math.random() * (9000 - 2000) + 2000),
      y: 72,
      z: Math.floor(Math.random() * (9000 - 2000) + 2000),
    }

    console.warn(player.tryTeleport(randomLoc));

    system.runTimeout(() => {
      player.removeTag("ess:tp_cooldown")
    }, 20 * 30);
  } else {
    player.sendMessage("§cTeleport is cooldown.")
  }
}

export type ACTpData = {
  nameTag: string;
  requestList: {
    nameTag: string;
    location: Vector3;
  }[];
};

export class ACTeleport {
  private acProperty = "ess:ac_teleport";

  private getWorldAuctionData(): ACTpData[] {
    const raw = world.getDynamicProperty(this.acProperty) as string;
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveWorldAuctionData(data: ACTpData[]) {
    world.setDynamicProperty(this.acProperty, JSON.stringify(data));
  }

  init(playerNameTag: string) {
    const data = this.getWorldAuctionData();
    if (!data.find(d => getActualName(d.nameTag) === playerNameTag)) {
      data.push({ nameTag: playerNameTag, requestList: [] });
      this.saveWorldAuctionData(data);
    }
  }

  set(playerNameTag: string, requestList: { nameTag: string; location: Vector3 }[]) {
    const data = this.getWorldAuctionData();
    const index = data.findIndex(d => getActualName(d.nameTag) === playerNameTag);

    if (index !== -1) {
      data[index].requestList = requestList;
    } else {
      data.push({ nameTag: playerNameTag, requestList });
    }

    this.saveWorldAuctionData(data);
  }

  get(playerNameTag: string) {
    const data = this.getWorldAuctionData();
    const found = data.find(d => getActualName(d.nameTag) === playerNameTag);
    return found?.requestList ?? [];
  }

  add(playerNameTag: string, request: { nameTag: string; location: Vector3 }) {
    const data = this.getWorldAuctionData();
    let playerData = data.find(d => getActualName(d.nameTag) === playerNameTag);

    if (!playerData) {
      playerData = { nameTag: playerNameTag, requestList: [] };
      data.push(playerData);
    }

    const exists = playerData.requestList.find(r =>
      r.nameTag === request.nameTag &&
      r.location.x === request.location.x &&
      r.location.y === request.location.y &&
      r.location.z === request.location.z
    );

    if (!exists) {
      playerData.requestList.push(request);
      this.saveWorldAuctionData(data);
    }
  }

  remove(playerNameTag: string, target: { nameTag: string; location: Vector3 }) {
    const data = this.getWorldAuctionData();
    const playerData = data.find(d => getActualName(d.nameTag) === playerNameTag);

    if (playerData) {
      playerData.requestList = playerData.requestList.filter(r =>
        !(getActualName(r.nameTag) === target.nameTag &&
          r.location.x === target.location.x &&
          r.location.y === target.location.y &&
          r.location.z === target.location.z)
      );
      this.saveWorldAuctionData(data);
    }
  }
}
