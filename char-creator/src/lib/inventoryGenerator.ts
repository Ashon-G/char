import type { Item, ItemRarity } from '../types/loadout';
import type { Asset } from './readyPlayerMe';
import { rpmAPI } from './readyPlayerMe';

// Map RPM asset types to our game slots
const RPM_ASSET_TYPE_TO_SLOT: Record<string, 'helmet' | 'chest' | 'gauntlets' | 'legs'> = {
  top: 'chest',
  bottom: 'legs',
  footwear: 'legs',
  outfit: 'chest',
  // Add more mappings as needed based on actual RPM asset types
};

// Determine rarity based on asset properties (you can customize this logic)
const determineRarity = (asset: Asset): ItemRarity => {
  // For now, use a simple hash-based approach
  const hash = asset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rarities: ItemRarity[] = ['common', 'uncommon', 'rare', 'legendary', 'exotic'];
  return rarities[hash % rarities.length];
};

// Generate power level based on rarity
const generatePower = (rarity: ItemRarity): number => {
  const basePower: Record<ItemRarity, [number, number]> = {
    common: [100, 150],
    uncommon: [150, 200],
    rare: [200, 250],
    legendary: [250, 300],
    exotic: [300, 350],
  };
  const [min, max] = basePower[rarity];
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Fetch RPM assets and convert them to game inventory items
 */
export async function fetchRPMInventoryItems(gender: 'male' | 'female'): Promise<Item[]> {
  try {
    console.log('[InventoryGenerator] Fetching RPM assets for gender:', gender);
    const assets = await rpmAPI.getAssets(gender);
    console.log('[InventoryGenerator] Fetched', assets.length, 'assets');

    const items: Item[] = [];

    for (const asset of assets) {
      // Only convert assets that map to our armor slots
      const slot = RPM_ASSET_TYPE_TO_SLOT[asset.type];
      if (!slot) continue;

      const rarity = determineRarity(asset);
      const power = generatePower(rarity);

      const item: Item = {
        id: `rpm-${asset.id}`,
        name: asset.name,
        slot,
        rarity,
        power,
        defense: Math.floor(power * 0.8), // 80% of power for defense
        icon: asset.iconUrl,
        description: `Ready Player Me ${asset.type}`,
        maxed: Math.random() > 0.7, // 30% chance of being maxed
        rpmAssetId: asset.id,
      };

      items.push(item);
    }

    console.log('[InventoryGenerator] Generated', items.length, 'inventory items');
    return items;
  } catch (error) {
    console.error('[InventoryGenerator] Failed to fetch RPM items:', error);
    return [];
  }
}

/**
 * Map RPM asset types to slot names for filtering
 */
export function getRPMAssetTypesForSlot(slot: 'helmet' | 'chest' | 'gauntlets' | 'legs'): string[] {
  const slotToTypes: Record<string, string[]> = {
    helmet: ['headwear'],
    chest: ['top', 'outfit'],
    gauntlets: ['gloves'],
    legs: ['bottom', 'footwear'],
  };
  return slotToTypes[slot] || [];
}
