import { Shop } from "../../interfaces";
import { titleRegistry } from "../title/config";

export const shopRegistry: Shop[] = [
  {
    category: "Basic Items",
    type: "item",
    itemList: [
      { typeId: "minecraft:iron_sword",      price: 3, texture: "items/iron_sword" },
      { typeId: "minecraft:iron_axe",        price: 3, texture: "items/iron_axe" },
      { typeId: "minecraft:iron_pickaxe",    price: 3, texture: "items/iron_pickaxe" },
      { typeId: "minecraft:iron_hoe",        price: 3, texture: "items/iron_hoe" },
      { typeId: "minecraft:iron_shovel",     price: 3, texture: "items/iron_shovel" },
      { typeId: "minecraft:iron_helmet",     price: 4, texture: "items/iron_helmet" },
      { typeId: "minecraft:iron_chestplate", price: 4, texture: "items/iron_chestplate" },
      { typeId: "minecraft:iron_leggings",   price: 4, texture: "items/iron_leggings" },
      { typeId: "minecraft:iron_boots",      price: 4, texture: "items/iron_boots" },
      { typeId: "minecraft:shield",          price: 2, texture: "items/shield" },
      { typeId: "minecraft:bow",             price: 3, texture: "items/bow_pulling_0" },
      { typeId: "minecraft:arrow",           price: 2, per: 16, texture: "items/arrow" },
      { typeId: "minecraft:baked_potato",    price: 6, texture: "items/potato_baked" },
    ]
  },
  {
    category: "Titles",
    type: "title",
    titleList: titleRegistry
  }
];