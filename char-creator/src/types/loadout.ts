export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'exotic';
export type ItemSlot =
  | 'subclass'
  | 'primary'
  | 'special'
  | 'heavy'
  | 'helmet'
  | 'gauntlets'
  | 'chest'
  | 'legs'
  | 'classItem';

export interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  power: number;
  defense?: number; // For armor
  attack?: number; // For weapons
  icon: string;
  description: string;
  maxed: boolean;
  rpmAssetId?: string; // Ready Player Me asset ID for armor items
}

export interface CharacterStats {
  level: number;
  power: number;
  defense: number;
  intellect: number;
  discipline: number;
  strength: number;
}

export interface Loadout {
  subclass: Item | null;
  primary: Item | null;
  special: Item | null;
  heavy: Item | null;
  helmet: Item | null;
  gauntlets: Item | null;
  chest: Item | null;
  legs: Item | null;
  classItem: Item | null;
}

export const SLOT_LABELS: Record<ItemSlot, string> = {
  subclass: 'Subclass',
  primary: 'Primary Weapon',
  special: 'Special Weapon',
  heavy: 'Heavy Weapon',
  helmet: 'Helmet',
  gauntlets: 'Gauntlets',
  chest: 'Chest Armor',
  legs: 'Leg Armor',
  classItem: 'Class Item',
};
