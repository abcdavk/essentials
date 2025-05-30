import { BlockPermutation, Entity, Vector3 } from "@minecraft/server";

// Job Menu interfaces

export type KillEntityOptions = {
    entity: Entity, 
    reward: number,
}

export type BlockOptions = {
    blockPerm: BlockPermutation,
    reward: number
}

// Claim Land interfaces

export type AllowList = {
  nameTag: string,
  allow_place_block: boolean,
  allow_break_block: boolean,
  allow_interact_with_block: boolean,
  allow_tnt: boolean,
  allow_button: boolean,
  allow_lever: boolean,
  allow_interact_armor_stand: boolean,
  allow_attack_animals: boolean,
  allow_attack_players: boolean,
}

export type Settings = {
  plotName: string,
  showBoundaries: boolean,
  anti_tnt: boolean,
  anti_minecart_tnt: boolean,
  anti_creeper: boolean,
  anti_arrow: boolean,
  anti_splash_potion: boolean,
  anti_hostile: boolean,
  anti_fireball: boolean,
  anti_end_crystal: boolean,
  anti_wind_charge: boolean,
}

export type ProtectionData = {
  id: string;
  nameTag: string;
  location: Vector3;
  protectionSize: number;
  isSell: boolean;
  sellPrice: number;
  settings: Settings;
  allowList: AllowList[]  
}

export type ExpiredDate = {
  location: Vector3,
  date: number,
  nameTag: string
}

// Shop interface
export type Shop = {
  type: string,
  category: string;
  itemList?: ShopItem[];
  titleList?: Title[]
}

export type ShopItem = {
  typeId: string;
  price: number,
  per?: number
}

export type Title = {
  price: number,
  color: string,
  name: string,
  texture: string
}

export type AuctionSold = {
  id: string,
  price: number,
  amount: number,
  expire: number
}

export type AuctionData = {
  nameTag: string,
  auctionList: AuctionSold[]
}
