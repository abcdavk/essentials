import { Shop } from "../../interfaces";

export const shopRegistry: Shop[] = [
  {
    category: "Basic Items",
    itemList: [
      { typeId: "minecraft:iron_sword",      price: 0.0064, texture: "items/iron_sword" },
      { typeId: "minecraft:iron_axe",        price: 0.0064, texture: "items/iron_axe" },
      { typeId: "minecraft:iron_pickaxe",    price: 0.0064, texture: "items/iron_pickaxe" },
      { typeId: "minecraft:iron_hoe",        price: 0.0064, texture: "items/iron_hoe" },
      { typeId: "minecraft:iron_shovel",     price: 0.0064, texture: "items/iron_shovel" },
      { typeId: "minecraft:iron_helmet",     price: 0.0064, texture: "items/iron_helmet" },
      { typeId: "minecraft:iron_chestplate", price: 0.0064, texture: "items/iron_chestplate" },
      { typeId: "minecraft:iron_leggings",   price: 0.0064, texture: "items/iron_leggings" },
      { typeId: "minecraft:iron_boots",      price: 0.0064, texture: "items/iron_boots" },
      { typeId: "minecraft:shield",          price: 0.0072, texture: "items/shield" },
      { typeId: "minecraft:bow",             price: 0.0064, texture: "items/bow_pulling_0" },
      { typeId: "minecraft:arrow",           price: 0.0012, texture: "items/arrow" },
      { typeId: "minecraft:baked_potato",    price: 0.0048, texture: "items/potato_baked" },
    ]
  }
];