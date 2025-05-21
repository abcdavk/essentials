import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Money } from "../money";

export function adminMenuMainUI(player: Player) {
  let form = new ActionFormData()
    .title('§f§0§1§r§l§0Admin Menu')
    .button('Set money')
    .button('Add money')
    .button('Remove money')
    .button('Remove Title');
  form.show(player).then(res => {
    if (res.selection === 0) adminMenuSetMoney(player);
    if (res.selection === 1) adminMenuAddMoney(player);
    if (res.selection === 2) adminMenuRemoveMoney(player);
    if (res.selection === 3) adminMenuRemoveTitle(player);
  });
}

function adminMenuRemoveTitle(player: Player) {

}

function adminMenuSetMoney(player: Player) {
  const players = world.getPlayers();
  let playerList: string[] = ["None"]

  players.forEach(p => {
    // if (p.nameTag !== player.nameTag) 
    playerList.push(p.nameTag);
  })

  let form = new ModalFormData()
    .title("Set Money")
    .dropdown("Select Online Player:", playerList, { defaultValueIndex: 0 })
    .textField("Or type player username", "Type here", { tooltip: "Type manually if the player is not in the dropdown/offline" })
    .textField("Amount to set:", "0");
  form.show(player).then(res => {
    if (res.formValues) {
      if (res.formValues[0] !== 0 && res.formValues[1] !== "") {
        player.sendMessage("§cCan only select one, dropdown or text field!")
      } else {
        const [ dropdown, typeName, amount ] = res.formValues as [ number, string,  string ];
        if (amount === undefined) return;
        if (dropdown !== 0) {
          new Money().set(playerList[dropdown], parseFloat(amount));
          player.sendMessage(`Set §b${playerList[dropdown]}§r money to §a${amount}§r`)
        }
        if (typeName !== "") {
          new Money().set(typeName, parseFloat(amount));
          player.sendMessage(`Set §b${typeName}§r money to §a${amount}§r`)
        }
      }
    }
  });
}

function adminMenuAddMoney(player: Player) {
  const players = world.getPlayers();
  let playerList: string[] = ["None"]

  players.forEach(p => {
    // if (p.nameTag !== player.nameTag) 
    playerList.push(p.nameTag);
  })

  let form = new ModalFormData()
    .title("Add Money")
    .dropdown("Select Online Player:", playerList, { defaultValueIndex: 0 })
    .textField("Or type player username", "Type here", { tooltip: "Type manually if the player is not in the dropdown/offline" })
    .textField("Amount to add:", "0");
  form.show(player).then(res => {
    if (res.formValues) {
      if (res.formValues[0] !== 0 && res.formValues[1] !== "") {
        player.sendMessage("§cCan only select one, dropdown or text field!")
      } else {
        const [ dropdown, typeName, amount ] = res.formValues as [ number, string,  string ];
        if (amount === undefined) return;
        if (dropdown !== 0) {
          new Money().add(playerList[dropdown], parseFloat(amount));
          player.sendMessage(`Add §a${amount}§r money to §b${playerList[dropdown]}`)
        }
        if (typeName !== "") {
          new Money().add(typeName, parseFloat(amount));
          player.sendMessage(`Add §a${amount}§r money to §b${typeName}`)
        }
      }
    }
  });
}

function adminMenuRemoveMoney(player: Player) {
  const players = world.getPlayers();
  let playerList: string[] = ["None"]

  players.forEach(p => {
    // if (p.nameTag !== player.nameTag) 
    playerList.push(p.nameTag);
  })

  let form = new ModalFormData()
    .title("Remove Money")
    .dropdown("Select Online Player:", playerList, { defaultValueIndex: 0 })
    .textField("Or type player username", "Type here", { tooltip: "Type manually if the player is not in the dropdown/offline" })
    .textField("Amount to remove:", "0");
  form.show(player).then(res => {
    if (res.formValues) {
      if (res.formValues[0] !== 0 && res.formValues[1] !== "") {
        player.sendMessage("§cCan only select one, dropdown or text field!")
      } else {
        const [ dropdown, typeName, amount ] = res.formValues as [ number, string,  string ];
        if (amount === undefined) return;
        if (dropdown !== 0) {
          const isCanceled = new Money().remove(playerList[dropdown], parseFloat(amount));
          if (!isCanceled) {
            player.sendMessage(`Remove §a${amount}§r money to §b${playerList[dropdown]}`);
          } else {
            player.sendMessage(`§c${playerList[dropdown]} doesn't have enough money`);
          }
        }
        if (typeName !== "") {
          const isCanceled = new Money().remove(typeName, parseFloat(amount));
          if (!isCanceled) {
            player.sendMessage(`Remove §a${amount}§r money to §b${typeName}`);
          } else {
            player.sendMessage(`§c${typeName} doesn't have enough money`);
          }
        }
      }
    }
  });
}