import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useLoadoutStore } from '../state/loadoutStore';
import { useAvatarStore } from '../state/avatarStore';
import type { ItemSlot } from '../types/loadout';
import { EquipmentSlot } from '../components/EquipmentSlot';
import { InventoryModal } from '../components/InventoryModal';
import { Character3D } from '../components/Character3D';
import { RPMCharacter3D } from '../components/RPMCharacter3D';
import { StatsHeader } from '../components/StatsHeader';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const LoadoutScreen = () => {
  const equipped = useLoadoutStore(state => state.equipped);
  const inventory = useLoadoutStore(state => state.inventory);
  const stats = useLoadoutStore(state => state.stats);
  const equipItem = useLoadoutStore(state => state.equipItem);
  const loadRPMItems = useLoadoutStore(state => state.loadRPMItems);

  const currentAvatarGlbUrl = useAvatarStore(state => state.currentAvatarGlbUrl);
  const currentAvatar = useAvatarStore(state => state.currentAvatar);
  const loadAssets = useAvatarStore(state => state.loadAssets);
  const validateAvatar = useAvatarStore(state => state.validateAvatar);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null);

  // Validate avatar on mount to ensure it's still valid
  useEffect(() => {
    validateAvatar().catch(err => {
      console.log('[LoadoutScreen] Avatar validation completed');
    });
  }, [validateAvatar]);

  // Load RPM assets when component mounts and avatar is ready
  useEffect(() => {
    if (currentAvatar && currentAvatar.gender) {
      const gender = currentAvatar.gender as 'male' | 'female';
      console.log('[LoadoutScreen] Loading RPM assets for gender:', gender);

      // Load assets into avatar store
      loadAssets(gender).catch(err => {
        console.error('[LoadoutScreen] Failed to load assets:', err);
      });

      // Load RPM items into inventory
      loadRPMItems(gender).catch(err => {
        console.error('[LoadoutScreen] Failed to load RPM inventory items:', err);
      });
    }
  }, [currentAvatar]);

  const handleSlotPress = (slot: ItemSlot) => {
    setSelectedSlot(slot);
    setModalVisible(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {/* Compact Stats Header */}
          <StatsHeader
            level={stats.level}
            power={stats.power}
            defense={stats.defense}
            intellect={stats.intellect}
            discipline={stats.discipline}
            strength={stats.strength}
          />

          <Animated.View entering={FadeIn} style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 3D Character Container - Positioned absolutely in center */}
              <View style={styles.characterContainer} pointerEvents="box-none">
                {currentAvatarGlbUrl ? (
                  <RPMCharacter3D style={styles.character3D} />
                ) : (
                  <Character3D style={styles.character3D} />
                )}
              </View>

            <View style={styles.content}>
              {/* LEFT COLUMN - WEAPONS */}
              <View style={styles.column}>
                {/* Subclass */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.subclass}
                    onPress={() => handleSlotPress('subclass')}
                    size="large"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Subclass
                  </Text>
                </View>

                {/* Primary Weapon */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.primary}
                    onPress={() => handleSlotPress('primary')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Primary
                  </Text>
                </View>

                {/* Special Weapon */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.special}
                    onPress={() => handleSlotPress('special')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Special
                  </Text>
                </View>

                {/* Heavy Weapon */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.heavy}
                    onPress={() => handleSlotPress('heavy')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Heavy
                  </Text>
                </View>
              </View>

              {/* RIGHT COLUMN - ARMOR */}
              <View style={styles.column}>
                {/* Helmet */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.helmet}
                    onPress={() => handleSlotPress('helmet')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Helmet
                  </Text>
                </View>

                {/* Gauntlets */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.gauntlets}
                    onPress={() => handleSlotPress('gauntlets')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Gauntlets
                  </Text>
                </View>

                {/* Chest */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.chest}
                    onPress={() => handleSlotPress('chest')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Chest
                  </Text>
                </View>

                {/* Legs */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.legs}
                    onPress={() => handleSlotPress('legs')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">Legs</Text>
                </View>

                {/* Class Item */}
                <View style={styles.slotContainer}>
                  <EquipmentSlot
                    item={equipped.classItem}
                    onPress={() => handleSlotPress('classItem')}
                    size="medium"
                  />
                  <Text className="text-gray-400 text-xs uppercase mt-2 tracking-wide">
                    Class Item
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <InventoryModal
        visible={modalVisible}
        slot={selectedSlot}
        items={inventory}
        onSelectItem={equipItem}
        onClose={() => setModalVisible(false)}
      />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  characterContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: width * 0.95, // Increased from 0.8 to 0.95 for wider viewport
    height: width * 1.5, // Keep height the same
    marginLeft: -(width * 0.475), // Adjusted centering for new width
    marginTop: -(width * 0.75), // Keep vertical centering the same
    zIndex: 0,
  },
  character3D: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 24,
    zIndex: 1,
  },
  slotContainer: {
    alignItems: 'center',
    width: '100%',
  },
});
