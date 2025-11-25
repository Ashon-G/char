import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import type { Item, ItemSlot } from '../types/loadout';
import { SLOT_LABELS } from '../types/loadout';
import { EquipmentSlot } from './EquipmentSlot';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface InventoryModalProps {
  visible: boolean;
  slot: ItemSlot | null;
  items: Item[];
  onSelectItem: (item: Item) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  visible,
  slot,
  items,
  onSelectItem,
  onClose,
}) => {
  const filteredItems = slot ? items.filter(item => item.slot === slot) : [];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={onClose} />
        </BlurView>

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(300)}
          exiting={SlideOutDown.springify().damping(20).stiffness(300)}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.header}>
            <Text className="text-white text-2xl font-bold uppercase tracking-wider">
              {slot ? SLOT_LABELS[slot] : 'Select Item'}
            </Text>
            <Pressable onPress={onClose} hitSlop={20}>
              <X size={28} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.itemsGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.itemWrapper}>
                <EquipmentSlot
                  item={item}
                  onPress={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  size="medium"
                />
                <Text className="text-white text-xs mt-2 text-center font-medium" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text className="text-gray-400 text-xs text-center">
                  {item.attack || item.defense || item.power}
                </Text>
              </View>
            ))}

            {filteredItems.length === 0 && (
              <View style={styles.emptyState}>
                <Text className="text-gray-500 text-lg">No items available</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingBottom: 40,
    gap: 20,
  },
  itemWrapper: {
    width: 85, // Reduced from 100 to 85
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
