import { StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import type { BottomTabParamList, RootStackParamList } from '@/navigation/types';
import { LoadoutScreen } from '@/screens/LoadoutScreen';
import { CharacterCreatorScreen } from '@/screens/CharacterCreatorScreen';
import { useAvatarStore } from '@/state/avatarStore';

/**
 * RootStackNavigator
 * The root navigator for the app, which contains the character creator and bottom tab navigator
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  const hasCompletedCreator = useAvatarStore(state => state.hasCompletedCreator);

  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      {!hasCompletedCreator ? (
        <RootStack.Screen
          name="CharacterCreator"
          component={CharacterCreatorScreen}
        />
      ) : (
        <RootStack.Screen
          name="Tabs"
          component={BottomTabNavigator}
        />
      )}
    </RootStack.Navigator>
  );
};

/**
 * BottomTabNavigator
 * The bottom tab navigator for the app - single loadout screen
 */
const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
  return (
    <BottomTab.Navigator
      initialRouteName="LoadoutTab"
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        tabBarActiveTintColor: '#4A9EFF',
        tabBarInactiveTintColor: '#64748B',
        headerShown: false,
      }}
      screenListeners={() => ({
        transitionStart: () => {
          Haptics.selectionAsync();
        },
      })}
    >
      <BottomTab.Screen
        name="LoadoutTab"
        component={LoadoutScreen}
        options={{
          title: 'Loadout',
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
};

export default RootNavigator;
