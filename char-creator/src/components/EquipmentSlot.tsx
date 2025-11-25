import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import type { Item } from '../types/loadout';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface EquipmentSlotProps {
  item: Item | null;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  item,
  onPress,
  size = 'medium',
}) => {
  const scale = useSharedValue(1);
  const glowProgress = useSharedValue(0);

  const sizeMap = {
    small: 70,
    medium: 88,
    large: 110,
  };

  const slotSize = sizeMap[size];

  // Start glow animation when item exists
  useEffect(() => {
    if (item) {
      glowProgress.value = withRepeat(
        withTiming(1, { duration: 2500 }),
        -1,
        true
      );
    } else {
      glowProgress.value = 0;
    }
  }, [item]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      glowProgress.value,
      [0, 0.5, 1],
      [0.3, 0.8, 0.3],
      Extrapolate.CLAMP
    );

    return {
      opacity: item ? opacity : 0,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
  };

  const getBorderColor = () => {
    if (!item) return '#4A5568';

    switch (item.rarity) {
      case 'exotic':
        return '#FFD700';
      case 'legendary':
        return '#9D5CFF';
      case 'rare':
        return '#5C9DFF';
      case 'uncommon':
        return '#367F36';
      default:
        return '#FFFFFF';
    }
  };

  const getGradientColors = (): [string, string] => {
    if (!item) return ['rgba(26, 32, 44, 0.6)', 'rgba(45, 55, 72, 0.6)'];

    switch (item.rarity) {
      case 'exotic':
        return ['rgba(74, 57, 0, 0.7)', 'rgba(26, 20, 0, 0.7)'];
      case 'legendary':
        return ['rgba(61, 30, 92, 0.7)', 'rgba(26, 13, 46, 0.7)'];
      case 'rare':
        return ['rgba(30, 58, 92, 0.7)', 'rgba(13, 26, 46, 0.7)'];
      case 'uncommon':
        return ['rgba(30, 58, 30, 0.7)', 'rgba(13, 26, 13, 0.7)'];
      default:
        return ['rgba(45, 55, 72, 0.7)', 'rgba(26, 32, 44, 0.7)'];
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[
      iconName.charAt(0).toUpperCase() + iconName.slice(1)
    ] || Icons.Box;
    return IconComponent;
  };

  const IconComponent = item ? getIconComponent(item.icon) : Icons.Lock;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
    >
      <View
        style={[
          styles.container,
          {
            width: slotSize,
            height: slotSize,
            borderColor: getBorderColor(),
            borderWidth: item?.maxed ? 3 : 2,
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Animated Glow Effect */}
        {item && (
          <AnimatedLinearGradient
            colors={[
              'transparent',
              `${getBorderColor()}40`,
              `${getBorderColor()}80`,
              `${getBorderColor()}40`,
              'transparent',
            ]}
            style={[StyleSheet.absoluteFill, glowStyle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        <View style={styles.content}>
          {item ? (
            <>
              {/* Show RPM asset image if available, otherwise show icon */}
              {item.rpmAssetId && item.icon.startsWith('http') ? (
                <Image
                  source={{ uri: item.icon }}
                  style={{
                    width: slotSize * 0.7,
                    height: slotSize * 0.7,
                    resizeMode: 'contain',
                  }}
                />
              ) : (
                <IconComponent size={slotSize * 0.5} color="#FFFFFF" strokeWidth={1.5} />
              )}
              {item.maxed && (
                <View style={styles.maxedBadge}>
                  <Icons.Star size={14} color="#FFD700" fill="#FFD700" />
                </View>
              )}
            </>
          ) : (
            <IconComponent size={slotSize * 0.4} color="#4A5568" strokeWidth={1} />
          )}
        </View>

        {item && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.overlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 0,
  },
  maxedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
  },
});
