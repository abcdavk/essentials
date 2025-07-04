import { titleRegistry } from "../title/config";
export const shopRegistry = [
    {
        category: "Basic Items",
        type: "item",
        itemList: [
            { typeId: "minecraft:iron_sword", price: 3 },
            { typeId: "minecraft:iron_axe", price: 3 },
            { typeId: "minecraft:iron_pickaxe", price: 3 },
            { typeId: "minecraft:iron_hoe", price: 3 },
            { typeId: "minecraft:iron_shovel", price: 3 },
            { typeId: "minecraft:iron_helmet", price: 4 },
            { typeId: "minecraft:iron_chestplate", price: 4 },
            { typeId: "minecraft:iron_leggings", price: 4 },
            { typeId: "minecraft:iron_boots", price: 4 },
            { typeId: "minecraft:shield", price: 2 },
            { typeId: "minecraft:bow", price: 3 },
            { typeId: "minecraft:arrow", price: 2, per: 16 },
            { typeId: "minecraft:baked_potato", price: 6 },
        ]
    },
    {
        category: "Plot",
        type: "item",
        itemList: [
            { typeId: "lc:protection_block_25", price: 50 },
            { typeId: "lc:protection_block_50", price: 75 },
            { typeId: "lc:protection_block_75", price: 100 },
            { typeId: "lc:protection_block_100", price: 150 },
            { typeId: "lc:protection_block_250", price: 400 },
            { typeId: "lc:protection_block_500", price: 800 },
        ]
    },
    {
        category: "Titles",
        type: "title",
        titleList: titleRegistry
    }
];
