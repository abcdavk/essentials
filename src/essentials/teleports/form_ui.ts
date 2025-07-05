import { Player, system, Vector3, world } from "@minecraft/server";
import { Protection } from "../landClaim/classes";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { convertTypeIdToAuxIcon, getActualName } from "../../utils";
import { ACTeleport } from "./main";
import { AlowListEnum } from "../../interfaces";

export function teleportPlot(player: Player) {
  if (!player.hasTag("ess:tp_cooldown")) {
    const protectionData = new Protection()
    let playerPlot = protectionData.getAll(getActualName(player.nameTag));
    
    playerPlot = playerPlot.concat(protectionData.getByPermission(AlowListEnum.allow_teleport_to_plot, getActualName(player.nameTag)));

    // console.warn(JSON.stringify(playerPlot))

    let form = new ActionFormData()
      .title(`§f§2§3§r§l§0Teleport to Plot`);

    for (const plot of playerPlot) {
      let { x, y, z } = plot.location;
      const icon = convertTypeIdToAuxIcon("minecraft:grass_block");

      form.button(`${plot.settings.plotName}\n${x.toFixed(0)} ${y.toFixed(0)} ${z.toFixed(0)}`, icon);
    }
    form.show(player).then(res => {
      if (res.selection === undefined) return;
      let plotLoc = playerPlot[res.selection].location;
      player.teleport(plotLoc);

      player.addTag("ess:tp_cooldown");

      system.runTimeout(() => {
        player.removeTag("ess:tp_cooldown")
      }, 20 * 10);
    });
  } else {
    player.sendMessage("§cTeleport is cooldown.")
  }
}

const teleport = new ACTeleport();

export function teleportAsk(player: Player) {
  const players = world.getPlayers();
  let playerList: string[] = ["None"];

  players.forEach(p => {
    if (getActualName(p.nameTag) !== getActualName(player.nameTag)) {
      playerList.push(getActualName(p.nameTag));
    }
  });

  let form = new ModalFormData()
    .title("Ask teleport")
    .dropdown("Select Online Player:", playerList, { defaultValueIndex: 0 })
    .textField("Or type player username", "Type here", { tooltip: "Type manually if the player is not in the dropdown/offline" })
    // .dropdown("Teleport to:", ["Target", "Here"], { defaultValueIndex: 0 });

  form.show(player).then(res => {
    if (!res.formValues) return;

    const [selectedIndex, typedName] = res.formValues as [number, string];

    const dropdownName = selectedIndex !== 0 ? playerList[selectedIndex] : "";
    const targetName = typedName !== "" ? typedName.trim() : dropdownName;

    if (!targetName || targetName === "None") {
      player.sendMessage("§cNo player selected or typed.");
      return;
    }

    if (dropdownName && typedName) {
      player.sendMessage("§cPlease use only dropdown or text field, not both.");
      return;
    }

    const targetPlayer = players.find(p => getActualName(p.nameTag) === targetName);
    if (!targetPlayer) {
      player.sendMessage(`§cPlayer "${targetName}" not found.`);
      return;
    } else {
      teleport.add(targetName, {
        nameTag: getActualName(player.nameTag),
        location: targetPlayer.location,
      });
      player.sendMessage(`§eRequest sent to bring §a${targetName} §eto you.`);
      targetPlayer.sendMessage(`§b${getActualName(player.nameTag)} §ewants to teleport you to them.`);
    }
  });
}

export function teleportRequest(player: Player) {
  const requestList = teleport.get(getActualName(player.nameTag));
  let form = new ActionFormData()
    .title(`§f§2§3§r§l§0Teleport Request`);

  for (const req of requestList) {
    let { x, y, z } = req.location;
    const icon = convertTypeIdToAuxIcon("minecraft:player_head");

    form.button(`${req.nameTag}\n${x.toFixed(0)} ${y.toFixed(0)} ${z.toFixed(0)}`, icon);
  }
  form.show(player).then(res => {
    if (res.selection === undefined) return;
    let requestName = requestList[res.selection].nameTag
    let requestLoc = requestList[res.selection].location;
    let confirm = new MessageFormData()
      .title(`§l${requestName}§r request`)
      .body(`Accept teleport request form §b${requestName}§r?`)
      .button1('Deny')
      .button2('Accept')
      .show(player).then(res => {
      if (res.selection === 0) {
        player.runCommand(`tellraw ${requestName} {"rawtext":[{"text":"§b${getActualName(player.nameTag)}§c rejected your teleport request."}]}`);
        teleport.remove(getActualName(player.nameTag), { nameTag: requestName, location: requestLoc });
      }
      if (res.selection === 1) {
        const { x, y, z } = requestLoc;

        player.runCommand(`tellraw ${requestName} {"rawtext":[{"text":"§b${getActualName(player.nameTag)}§a accepted your teleport request."}]}`);
        player.runCommand(`tp ${requestName} ${x} ${y} ${z}`)
        player.addTag("ess:tp_cooldown");

        teleport.remove(getActualName(player.nameTag), { nameTag: requestName, location: requestLoc });

        system.runTimeout(() => {
          player.removeTag("ess:tp_cooldown")
        }, 20 * 10);
      }
    });
  });
}