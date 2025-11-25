import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Avatar, AvatarTemplate, Asset } from '../lib/readyPlayerMe';
import { rpmAPI } from '../lib/readyPlayerMe';

interface AvatarState {
  // Current avatar data
  currentAvatar: Avatar | null;
  currentAvatarGlbUrl: string | null;
  hasCompletedCreator: boolean;
  avatarValidatedAt: number | null; // Timestamp of last validation

  // Creator state
  selectedTemplate: AvatarTemplate | null;
  selectedGender: 'male' | 'female' | null;
  availableAssets: Asset[];
  equippedAssets: Record<string, string>; // assetType -> assetId

  // Actions
  setSelectedTemplate: (template: AvatarTemplate) => void;
  setSelectedGender: (gender: 'male' | 'female') => void;
  createDraftAvatar: (templateId: string, bodyType: 'fullbody' | 'halfbody') => Promise<void>;
  equipAsset: (assetType: string, assetId: string) => Promise<void>;
  updateAvatarWithAsset: (assetId: string) => Promise<void>; // New method for game inventory
  saveAvatar: () => Promise<void>;
  loadAssets: (gender: 'male' | 'female') => Promise<void>;
  resetCreator: () => void;
  validateAvatar: () => Promise<void>; // New method to validate avatar on startup
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentAvatar: null,
      currentAvatarGlbUrl: null,
      hasCompletedCreator: false,
      avatarValidatedAt: null,
      selectedTemplate: null,
      selectedGender: null,
      availableAssets: [],
      equippedAssets: {},

      setSelectedTemplate: (template) => {
        set({ selectedTemplate: template });
      },

      setSelectedGender: (gender) => {
        set({ selectedGender: gender });
      },

      createDraftAvatar: async (templateId, bodyType) => {
        try {
          const avatar = await rpmAPI.createDraftAvatar(templateId, bodyType);
          const glbUrl = rpmAPI.getAvatarGlbUrl(avatar.id, true);

          set({
            currentAvatar: avatar,
            currentAvatarGlbUrl: glbUrl,
            avatarValidatedAt: Date.now(), // Mark as just created, so validation skips it
          });
        } catch (error) {
          console.error('Failed to create draft avatar:', error);
          throw error;
        }
      },

      equipAsset: async (assetType, assetId) => {
        const { currentAvatar, equippedAssets } = get();
        if (!currentAvatar) return;

        try {
          // Update local state immediately
          const newEquippedAssets = { ...equippedAssets, [assetType]: assetId };
          set({ equippedAssets: newEquippedAssets });

          // Update avatar on server
          const updatedAvatar = await rpmAPI.updateAvatar(currentAvatar.id, {
            [assetType]: assetId,
          });

          const glbUrl = rpmAPI.getAvatarGlbUrl(updatedAvatar.id, true);

          set({
            currentAvatar: updatedAvatar,
            currentAvatarGlbUrl: glbUrl,
          });
        } catch (error) {
          console.error('Failed to equip asset:', error);
          // Revert on error
          set({ equippedAssets });
          throw error;
        }
      },

      updateAvatarWithAsset: async (assetId) => {
        const { currentAvatar, availableAssets, selectedGender, selectedTemplate } = get();
        if (!currentAvatar) {
          console.log('[AvatarStore] No avatar to update');
          return;
        }

        try {
          // Find the asset to determine its type
          const asset = availableAssets.find((a) => a.id === assetId);
          if (!asset) {
            console.log('[AvatarStore] Asset not found in available assets:', assetId);

            // If assets haven't been loaded yet, try loading them
            if (availableAssets.length === 0 && selectedGender) {
              console.log('[AvatarStore] Loading assets first...');
              await get().loadAssets(selectedGender);

              // Try finding the asset again
              const updatedAssets = get().availableAssets;
              const foundAsset = updatedAssets.find((a) => a.id === assetId);
              if (!foundAsset) {
                console.log('[AvatarStore] Asset still not found after loading');
                return;
              }
              console.log('[AvatarStore] Found asset:', foundAsset.type, foundAsset.name);
            } else {
              return;
            }
          }

          const assetToUse = asset || get().availableAssets.find((a) => a.id === assetId);
          if (!assetToUse) return;

          console.log('[AvatarStore] Updating avatar with asset:', assetToUse.type, assetToUse.name);

          // Update avatar with the new asset
          const updatedAvatar = await rpmAPI.updateAvatar(currentAvatar.id, {
            [assetToUse.type]: assetId,
          });

          // Merge with current avatar to preserve fields like gender and bodyType
          const mergedAvatar = {
            ...currentAvatar,
            ...updatedAvatar,
            gender: updatedAvatar.gender || currentAvatar.gender,
            bodyType: updatedAvatar.bodyType || currentAvatar.bodyType,
          };

          // Wait a moment for RPM to generate the new GLB model
          console.log('[AvatarStore] Waiting for RPM to generate updated 3D model...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

          const glbUrl = rpmAPI.getAvatarGlbUrl(mergedAvatar.id, false);

          set({
            currentAvatar: mergedAvatar,
            currentAvatarGlbUrl: glbUrl,
          });

          console.log('[AvatarStore] Avatar updated successfully with', assetToUse.name);
        } catch (error) {
          // Check if it's a 404 error (avatar not found)
          if (error instanceof Error && error.message.includes('404')) {
            console.log('[AvatarStore] Avatar not found (404). The avatar may belong to a different user or has expired.');
            console.log('[AvatarStore] Clearing invalid avatar. Please restart the app and create a new character.');

            // Clear the invalid avatar so it doesn't keep trying to use it
            set({
              currentAvatar: null,
              currentAvatarGlbUrl: null,
            });

            return; // Don't throw - fail silently
          }

          console.error('[AvatarStore] Failed to update avatar with asset:', error);
          throw error;
        }
      },

      saveAvatar: async () => {
        const { currentAvatar } = get();
        if (!currentAvatar) return;

        try {
          const savedAvatar = await rpmAPI.saveAvatar(currentAvatar.id);
          const glbUrl = rpmAPI.getAvatarGlbUrl(savedAvatar.id, false);

          set({
            currentAvatar: savedAvatar,
            currentAvatarGlbUrl: glbUrl,
            hasCompletedCreator: true,
          });
        } catch (error) {
          console.error('Failed to save avatar:', error);
          throw error;
        }
      },

      loadAssets: async (gender) => {
        try {
          const assets = await rpmAPI.getAssets(gender);
          set({ availableAssets: assets });
        } catch (error) {
          console.error('Failed to load assets:', error);
          throw error;
        }
      },

      resetCreator: () => {
        set({
          selectedTemplate: null,
          selectedGender: null,
          equippedAssets: {},
        });
      },

      validateAvatar: async () => {
        const { currentAvatar, avatarValidatedAt } = get();
        if (!currentAvatar) return;

        // Skip validation if avatar was just created (within last 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (avatarValidatedAt && avatarValidatedAt > fiveMinutesAgo) {
          console.log('[AvatarStore] Skipping validation - avatar was recently created/validated');
          return;
        }

        try {
          console.log('[AvatarStore] Validating persisted avatar...');
          // Try to fetch the avatar to see if it's still valid
          const response = await fetch(`${rpmAPI.getAvatarGlbUrl(currentAvatar.id, true)}`);

          if (!response.ok) {
            console.log('[AvatarStore] Persisted avatar is invalid. Clearing...');
            set({
              currentAvatar: null,
              currentAvatarGlbUrl: null,
              hasCompletedCreator: false,
              avatarValidatedAt: null,
            });
          } else {
            console.log('[AvatarStore] Persisted avatar is valid');
            set({ avatarValidatedAt: Date.now() });
          }
        } catch (error) {
          console.log('[AvatarStore] Could not validate avatar:', error);
          // Clear invalid avatar
          set({
            currentAvatar: null,
            currentAvatarGlbUrl: null,
            hasCompletedCreator: false,
            avatarValidatedAt: null,
          });
        }
      },
    }),
    {
      name: 'avatar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentAvatar: state.currentAvatar,
        currentAvatarGlbUrl: state.currentAvatarGlbUrl,
        hasCompletedCreator: state.hasCompletedCreator,
        selectedTemplate: state.selectedTemplate,
        selectedGender: state.selectedGender,
        avatarValidatedAt: state.avatarValidatedAt,
      }),
    }
  )
);
