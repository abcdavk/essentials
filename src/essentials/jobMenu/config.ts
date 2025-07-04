import { EntityComponentTypes, Player } from "@minecraft/server";
import { BlockOptions, KillEntityOptions } from "../../interfaces";
import { giveReward } from "./main";

export const allJobs = [
    {
      initialRequirement: 64,
      requirementStep: 64,
      initialReward: 0.08,
      rewardStep: 0.01,
      description: "Harvest crops to earn money.",
      title: "Farming",
      type: ["break_block"],
      cropBlocks: [
        { id: "minecraft:wheat", state: "growth", value: 7 },
        { id: "minecraft:carrots", state: "growth", value: 7 },
        { id: "minecraft:potatoes", state: "growth", value: 7 },
        { id: "minecraft:beetroot", state: "growth", value: 7 },
        { id: "minecraft:sweet_berry_bush", state: "growth", value: 3 },
        { id: "minecraft:nether_wart", state: "age", value: 3 },
        { id: "minecraft:cocoa", state: "age", value: 2 },
        { id: "minecraft:cactus", state: "age", value: 8 },
        { id: "minecraft:reeds", state: "age", value: 9 }, // sugar cane
        { id: "minecraft:torchflower", state: null, value: null },
        { id: "minecraft:pitcher_crop", state: "growth", value: 4 },
        // { id: "minecraft:pumpkin", state: null, value: null },
        // { id: "minecraft:melon_block", state: null, value: null },
      ],
      
      executeBreak: function(player: Player, options?: any) {
        let { 
            blockPerm, reward
        }: BlockOptions = options
        const cropData = this.cropBlocks.find(crop => crop.id === blockPerm.type.id);
        if (!cropData) return;

        if (!cropData.state || cropData.value === null) {
            giveReward(player, reward);
            return;
        }
        try {
            // @ts-ignore
            const currentGrowth = blockPerm.getState(cropData.state as keyof BlockStateSuperset);

            if (Number(currentGrowth) === Number(cropData.value)) {
                giveReward(player, reward);
            }
        } catch (e) {
            console.warn(JSON.stringify(options));
        }
      }      
    },
    {
      initialRequirement: 32,
      requirementStep: 32,
      initialReward: 0.15,
      rewardStep: 0.02,
      description: "Kill hostile mobs to earn money.",
      title: "Killing",
      type: "kill_entity",
      families: [
        "monster",
        "undead"
      ],
      execute: function(player: Player, options?: any) {
        let {
            entity, reward
        }: KillEntityOptions = options;
        const familyData = this.families.find(family => entity.getComponent(EntityComponentTypes.TypeFamily)?.hasTypeFamily(family));
        if (!familyData) return;
        // console.warn("You killing ", entity.typeId);
        giveReward(player, reward);
      }
    },
    {
      initialRequirement: 64,
      requirementStep: 64,
      initialReward: 0.05,
      rewardStep: 0.01,
      maxLevel: 10,
      description: "Dig sand and dirt to earn money.",
      title: "Diging",
      type: ["break_block"],
      blocks: [
        "minecraft:sand",
        "minecraft:gravel"
      ],
      executeBreak: function(player: Player, options?: any) {
        let { 
            blockPerm, reward
        }: BlockOptions = options;
        const blockData = this.blocks.find(block => blockPerm.type.id === block);
        if (!blockData) return;
        giveReward(player, reward);
      }
    },
    {
      initialRequirement: 16,
      requirementStep: 16,
      initialReward: 1.0,
      rewardStep: 0.25,
      description: "Catch fish to earn money.",
      title: "Fishing",
      type: "fishing",
      executeFishing: function(player: Player, options?: any) {
        let {
            reward
        }: { reward: number } = options;
        giveReward(player, reward);
      }
    },
    {
      initialRequirement: 64,
      requirementStep: 64,
      initialReward: 0.05,
      rewardStep: 0.01,
      description: "Cut down trees to earn money.",
      title: "Lumbering",
      type: ["break_block"],
      breakBlock: [
        "minecraft:acacia_log",
        "minecraft:birch_log",
        "minecraft:cherry_log",
        "minecraft:dark_oak_log",
        "minecraft:jungle_log",
        "minecraft:mangrove_log",
        "minecraft:oak_log",
        "minecraft:spruce_log",
        "minecraft:warped_stem",
        "minecraft:crimson_stem",
        "minecraft:pale_oak_log"
      ],
      executeBreak: function(player: Player, options?: any) {
        let { 
            blockPerm, reward
        }: BlockOptions = options;
        const breakBlockData = this.breakBlock.find(b => blockPerm.type.id === b);
        if (!breakBlockData) return;
        giveReward(player, reward);
      },
    },
    {
      initialRequirement: 64,
      requirementStep: 64,
      initialReward: 0.05,
      rewardStep: 0.01,
      description: "Mine stones and ores to earn money.",
      title: "Mining",
      type: ["break_block"],
      blocks: [
        "minecraft:coal_ore",
        "minecraft:deepslate_coal_ore",
        "minecraft:iron_ore",
        "minecraft:deepslate_iron_ore",
        "minecraft:copper_ore",
        "minecraft:deepslate_copper_ore",
        "minecraft:gold_ore",
        "minecraft:deepslate_gold_ore",
        "minecraft:redstone_ore",
        "minecraft:deepslate_redstone_ore",
        "minecraft:lapis_ore",
        "minecraft:deepslate_lapis_ore",
        "minecraft:diamond_ore",
        "minecraft:deepslate_diamond_ore",
        "minecraft:emerald_ore",
        "minecraft:deepslate_emerald_ore",
        "minecraft:nether_gold_ore",
        "minecraft:quartz_ore",
        "minecraft:ancient_debris","minecraft:stone",
        "minecraft:granite",
        "minecraft:diorite",
        "minecraft:andesite",
        "minecraft:calcite",
        "minecraft:tuff",
        "minecraft:blackstone",
        "minecraft:deepslate"
      ],
      executeBreak: function(player: Player, options?: any) {
        let { 
            blockPerm, reward
        }: BlockOptions = options;
        const blockData = this.blocks.find(block => blockPerm.type.id === block);
        if (!blockData) return;
        giveReward(player, reward);
      }
    },
];

export const fishingLoots = [
  "minecraft:cod",
  "minecraft:salmon",
  "minecraft:pufferfish",
  "minecraft:tropical_fish",
  "minecraft:bow",
  "minecraft:enchanted_book",
  "minecraft:fishing_rod",
  "minecraft:name_tag",
  "minecraft:nautilus_shell",
  "minecraft:saddle",
  "minecraft:leather_boots",
  "minecraft:stick",
  "minecraft:string",
  "minecraft:bowl",
  "minecraft:tripwire_hook",
  "minecraft:rotten_flesh",
  "minecraft:bone",
  "minecraft:ink_sac",
  "minecraft:water_bottle"
];