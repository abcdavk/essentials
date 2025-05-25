import { system, world } from "@minecraft/server";
import { Expired, Protection } from "./classes";
import { ActionFormData } from "@minecraft/server-ui";
import { handleAddFriendUI, handleRemoveFriendUI, handleSettingUI, handleShowAllFriendUI } from "./form_ui";
export function handlePlaceProtectionBlock(data) {
    let { dimension, permutationBeingPlaced, block, player } = data;
    const protectionSize = parseInt(permutationBeingPlaced.type.id.split("_")[2]);
    new Protection().init(player.nameTag, block.center(), protectionSize);
    new Expired().init(player.nameTag, block.center());
    dimension.spawnEntity("lc:protection_block", block.center());
    console.log("Protection size: ", protectionSize);
}
export function handleBreakProtectionBlock(data) {
    let { dimension, block, player } = data;
    const entities = dimension.getEntities({
        type: "lc:protection_block",
        location: block.center()
    });
    entities.forEach(protectionEntity => {
        // console.log("Removing protection entity, size: ", protectionEntity.getDynamicProperty("lc:protection_size"))
        const protection = new Protection();
        const expired = new Expired();
        const protectionData = protection.get(block.center());
        if (protectionData === undefined)
            return;
        if (protectionData.nameTag === player.nameTag) {
            protection.remove(block.center());
            expired.remove(block.center());
            protectionEntity.remove();
        }
    });
}
export function handleInteractProtectionBlock(data) {
    let { block, player, } = data;
    const dimension = world.getDimension(player.dimension.id);
    const protectionData = new Protection().get(block.center());
    if (protectionData.nameTag === player.nameTag) {
        if (player.hasTag("ess:inAuctionSell"))
            return;
        let form = new ActionFormData()
            .title('§f§2§0§r§l§0Protection Block Menu')
            .button('', "textures/ui/new_ui/claimblock/C1")
            .button('', "textures/ui/new_ui/claimblock/C2")
            .button('', "textures/ui/new_ui/claimblock/C3")
            .button('', "textures/ui/new_ui/claimblock/C4");
        form.show(player).then(res => {
            if (res.selection === 3) {
                system.run(() => { handleAddFriendUI(player, block, dimension, protectionData); });
            }
            if (res.selection === 2) {
                system.run(() => { handleRemoveFriendUI(player, block, dimension, protectionData); });
            }
            if (res.selection === 1) {
                system.run(() => { handleShowAllFriendUI(player, block, dimension, protectionData); });
            }
            if (res.selection === 0) {
                system.run(() => { handleSettingUI(player, block, dimension, protectionData); });
            }
        });
    }
}
