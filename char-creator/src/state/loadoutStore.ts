import { create } from 'zustand';
import type { Item, Loadout, CharacterStats, ItemSlot } from '../types/loadout';
import { fetchRPMInventoryItems } from '../lib/inventoryGenerator';
import { useAvatarStore } from './avatarStore';

interface LoadoutState {
  equipped: Loadout;
  inventory: Item[];
  stats: CharacterStats;
  rpmItemsLoaded: boolean;
  rpmGender: 'male' | 'female' | null; // Track which gender was loaded
  equipItem: (item: Item) => void;
  calculateStats: () => void;
  loadRPMItems: (gender: 'male' | 'female') => Promise<void>;
}

// Sample inventory items with Destiny-style data
const createInventory = (): Item[] => [
  // Subclasses
  {
    id: 'sub-1',
    name: 'Defender',
    slot: 'subclass',
    rarity: 'legendary',
    power: 300,
    icon: 'shield',
    description: 'The wall against which the Darkness breaks.',
    maxed: true,
  },
  {
    id: 'sub-2',
    name: 'Striker',
    slot: 'subclass',
    rarity: 'legendary',
    power: 280,
    icon: 'zap',
    description: 'At close quarters a fist is better than any gun.',
    maxed: false,
  },

  // Primary Weapons
  {
    id: 'pri-1',
    name: 'Hung Jury SR4',
    slot: 'primary',
    rarity: 'legendary',
    power: 310,
    attack: 310,
    icon: 'crosshair',
    description: 'Omolon scout rifle with exceptional stability.',
    maxed: false,
  },
  {
    id: 'pri-2',
    name: 'The Last Word',
    slot: 'primary',
    rarity: 'exotic',
    power: 320,
    attack: 320,
    icon: 'target',
    description: 'Yours... Not mine.',
    maxed: true,
  },
  {
    id: 'pri-3',
    name: 'Suros Regime',
    slot: 'primary',
    rarity: 'exotic',
    power: 300,
    attack: 300,
    icon: 'crosshair',
    description: 'Nostalgia as a weapon of war.',
    maxed: false,
  },

  // Special Weapons
  {
    id: 'sec-1',
    name: '1000-Yard Stare',
    slot: 'special',
    rarity: 'legendary',
    power: 315,
    attack: 315,
    icon: 'scope',
    description: 'The next best thing to a gun that fires guns.',
    maxed: false,
  },
  {
    id: 'sec-2',
    name: 'Black Spindle',
    slot: 'special',
    rarity: 'exotic',
    power: 310,
    attack: 310,
    icon: 'crosshair',
    description: 'Your only existence shall be that which I weave for you.',
    maxed: false,
  },
  {
    id: 'sec-3',
    name: 'Invective',
    slot: 'special',
    rarity: 'exotic',
    power: 290,
    attack: 290,
    icon: 'target',
    description: 'I tried to talk them down. They made a grab for my Ghost.',
    maxed: false,
  },

  // Heavy Weapons
  {
    id: 'hvy-1',
    name: 'Truth',
    slot: 'heavy',
    rarity: 'exotic',
    power: 320,
    attack: 320,
    icon: 'rocket',
    description: 'Rocket launcher with aggressive tracking.',
    maxed: false,
  },
  {
    id: 'hvy-2',
    name: 'Sleeper Simulant',
    slot: 'heavy',
    rarity: 'exotic',
    power: 310,
    attack: 310,
    icon: 'zap',
    description: 'Subroutine IKELOS: Status=complete.',
    maxed: false,
  },

  // Helmets
  {
    id: 'hel-1',
    name: 'Helm of Saint-14',
    slot: 'helmet',
    rarity: 'exotic',
    power: 310,
    defense: 310,
    icon: 'shield',
    description: 'He walked out into the demon light. But at the end he was brighter.',
    maxed: true,
  },
  {
    id: 'hel-2',
    name: 'Iron Regalia Helm',
    slot: 'helmet',
    rarity: 'legendary',
    power: 300,
    defense: 300,
    icon: 'crown',
    description: 'Forged in honor of the Iron Lords.',
    maxed: false,
  },

  // Gauntlets
  {
    id: 'gau-1',
    name: 'Ruin Wings',
    slot: 'gauntlets',
    rarity: 'exotic',
    power: 305,
    defense: 305,
    icon: 'hand',
    description: 'In the Garden grows a tree of silver wings.',
    maxed: false,
  },
  {
    id: 'gau-2',
    name: 'Iron Regalia Gauntlets',
    slot: 'gauntlets',
    rarity: 'legendary',
    power: 295,
    defense: 295,
    icon: 'hand',
    description: 'Forged in honor of the Iron Lords.',
    maxed: false,
  },

  // Chest Armor
  {
    id: 'che-1',
    name: 'The Armamentarium',
    slot: 'chest',
    rarity: 'exotic',
    power: 308,
    defense: 308,
    icon: 'shield',
    description: 'From the lab of Ikora Rey. Specifically designed for Titans.',
    maxed: false,
  },
  {
    id: 'che-2',
    name: 'Iron Regalia Vest',
    slot: 'chest',
    rarity: 'legendary',
    power: 300,
    defense: 300,
    icon: 'shield',
    description: 'Forged in honor of the Iron Lords.',
    maxed: false,
  },
  {
    id: 'che-3',
    name: 'Twilight Garrison',
    slot: 'chest',
    rarity: 'exotic',
    power: 290,
    defense: 290,
    icon: 'shield',
    description: 'Fieldwire supplies for a long patrol.',
    maxed: false,
  },

  // Legs
  {
    id: 'leg-1',
    name: 'Dunemarchers',
    slot: 'legs',
    rarity: 'exotic',
    power: 312,
    defense: 312,
    icon: 'footprints',
    description: 'Travel the battle line with speed and authority.',
    maxed: false,
  },
  {
    id: 'leg-2',
    name: 'Iron Regalia Greaves',
    slot: 'legs',
    rarity: 'legendary',
    power: 298,
    defense: 298,
    icon: 'footprints',
    description: 'Forged in honor of the Iron Lords.',
    maxed: false,
  },

  // Class Items
  {
    id: 'cla-1',
    name: 'Mark of the Sunforged',
    slot: 'classItem',
    rarity: 'legendary',
    power: 310,
    defense: 310,
    icon: 'flame',
    description: 'Let the forge fires roar.',
    maxed: false,
  },
  {
    id: 'cla-2',
    name: 'Mark of the Risen',
    slot: 'classItem',
    rarity: 'legendary',
    power: 300,
    defense: 300,
    icon: 'flag',
    description: 'We are the wall against the night.',
    maxed: false,
  },
  {
    id: 'cla-3',
    name: 'Iron Banner Mark',
    slot: 'classItem',
    rarity: 'legendary',
    power: 295,
    defense: 295,
    icon: 'badge',
    description: 'Show your allegiance to the Iron Lords.',
    maxed: false,
  },
];

const equippedIds = ['sub-1', 'pri-1', 'sec-1', 'hvy-1', 'hel-1', 'gau-1', 'che-1', 'leg-1', 'cla-1'];

const initialLoadout = (): Loadout => {
  const inv = createInventory();
  return {
    subclass: inv.find(i => i.id === 'sub-1') || null,
    primary: inv.find(i => i.id === 'pri-1') || null,
    special: inv.find(i => i.id === 'sec-1') || null,
    heavy: inv.find(i => i.id === 'hvy-1') || null,
    helmet: inv.find(i => i.id === 'hel-1') || null,
    gauntlets: inv.find(i => i.id === 'gau-1') || null,
    chest: inv.find(i => i.id === 'che-1') || null,
    legs: inv.find(i => i.id === 'leg-1') || null,
    classItem: inv.find(i => i.id === 'cla-1') || null,
  };
};

const initialInventory = (): Item[] => {
  return createInventory().filter(item => !equippedIds.includes(item.id));
};

export const useLoadoutStore = create<LoadoutState>((set, get) => ({
  equipped: initialLoadout(),
  inventory: initialInventory(),
  rpmItemsLoaded: false,
  rpmGender: null,
  stats: {
    level: 40,
    power: 0,
    defense: 0,
    intellect: 195,
    discipline: 207,
    strength: 118,
  },

  equipItem: (item: Item) => {
    set(state => {
      const currentEquipped = state.equipped[item.slot];

      // Swap the item
      const newEquipped = {
        ...state.equipped,
        [item.slot]: item,
      };

      // Update inventory - remove the newly equipped item and add the previously equipped one
      let newInventory = state.inventory.filter(invItem => invItem.id !== item.id);
      if (currentEquipped) {
        newInventory = [...newInventory, currentEquipped];
      }

      return {
        equipped: newEquipped,
        inventory: newInventory,
      };
    });

    // If the item has an RPM asset, update the avatar
    if (item.rpmAssetId) {
      const armorSlots: ItemSlot[] = ['helmet', 'gauntlets', 'chest', 'legs'];
      if (armorSlots.includes(item.slot)) {
        console.log('[LoadoutStore] Equipping RPM armor item:', item.name);
        useAvatarStore.getState().updateAvatarWithAsset(item.rpmAssetId).catch(err => {
          console.error('[LoadoutStore] Failed to update avatar:', err);
        });
      }
    }

    // Recalculate stats after equipping
    get().calculateStats();
  },

  calculateStats: () => {
    set(state => {
      const equipped = state.equipped;
      const slots = Object.values(equipped).filter(Boolean) as Item[];

      // Calculate total power (average of all equipped items)
      const totalPower = slots.reduce((sum, item) => sum + item.power, 0);
      const avgPower = slots.length > 0 ? Math.round(totalPower / slots.length) : 0;

      // Calculate total defense (sum of armor pieces only)
      const armorSlots: ItemSlot[] = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem'];
      const armorPieces = slots.filter(item => armorSlots.includes(item.slot));
      const totalDefense = armorPieces.reduce((sum, item) => sum + (item.defense || 0), 0);

      return {
        stats: {
          ...state.stats,
          power: avgPower,
          defense: totalDefense,
        },
      };
    });
  },

  loadRPMItems: async (gender: 'male' | 'female') => {
    const { rpmItemsLoaded, rpmGender, inventory } = get();

    // Check if we already loaded items for this gender
    if (rpmItemsLoaded && rpmGender === gender) {
      console.log('[LoadoutStore] RPM items already loaded for', gender);
      return;
    }

    // If gender changed, remove old RPM items first
    if (rpmItemsLoaded && rpmGender !== gender) {
      console.log('[LoadoutStore] Gender changed from', rpmGender, 'to', gender, '- removing old RPM items');
      const filteredInventory = inventory.filter(item => !item.id.startsWith('rpm-'));
      set({ inventory: filteredInventory, rpmItemsLoaded: false, rpmGender: null });
    }

    try {
      console.log('[LoadoutStore] Loading RPM inventory items for', gender);
      const rpmItems = await fetchRPMInventoryItems(gender);

      if (rpmItems.length > 0) {
        set(state => {
          // Deduplicate items by ID - ensure no duplicates are added
          const existingIds = new Set(state.inventory.map(item => item.id));
          const uniqueNewItems = rpmItems.filter(item => !existingIds.has(item.id));

          return {
            inventory: [...state.inventory, ...uniqueNewItems],
            rpmItemsLoaded: true,
            rpmGender: gender,
          };
        });
        console.log('[LoadoutStore] Added', rpmItems.length, 'RPM items to inventory for', gender);
      }
    } catch (error) {
      console.error('[LoadoutStore] Failed to load RPM items:', error);
    }
  },
}));

// Initialize stats on store creation
setTimeout(() => {
  useLoadoutStore.getState().calculateStats();
}, 0);
