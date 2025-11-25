import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Flame, Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface StatsHeaderProps {
  level: number;
  power: number;
  defense: number;
  intellect: number;
  discipline: number;
  strength: number;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  level,
  power,
  defense,
  intellect,
  discipline,
  strength,
}) => {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-100, 100],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.header}>
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Left Side - Level & Power */}
      <View style={styles.leftSection}>
        <View style={styles.statGroup}>
          <Text className="text-gray-400 text-xs uppercase tracking-wider font-medium">
            Level
          </Text>
          <Text className="text-white text-3xl font-bold">{level}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statGroup}>
          <Text className="text-gray-400 text-xs uppercase tracking-wider font-medium">
            Power
          </Text>
          <View style={styles.powerContainer}>
            <Text className="text-yellow-400 text-3xl font-bold">{power}</Text>
            {/* Golden shimmer effect */}
            <Animated.View style={[styles.shimmer, shimmerStyle]}>
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255, 217, 65, 0.6)',
                  'rgba(255, 215, 0, 0.8)',
                  'rgba(255, 217, 65, 0.6)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Right Side - Stats */}
      <View style={styles.rightSection}>
        <View style={styles.miniStat}>
          <Text className="text-gray-400 text-xs uppercase tracking-wide">Def</Text>
          <Text className="text-white text-lg font-semibold ml-1">{defense}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.miniStat}>
          <Zap size={14} color="#4A9EFF" strokeWidth={2.5} />
          <Text className="text-white text-sm font-medium ml-1">{intellect}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.miniStat}>
          <Flame size={14} color="#FF6B4A" strokeWidth={2.5} />
          <Text className="text-white text-sm font-medium ml-1">{discipline}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.miniStat}>
          <Dumbbell size={14} color="#FFD700" strokeWidth={2.5} />
          <Text className="text-white text-sm font-medium ml-1">{strength}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statGroup: {
    alignItems: 'center',
  },
  powerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    bottom: 0,
    width: 100,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
