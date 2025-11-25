import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/navigation/types";
import LootBoxScreen from "@/screens/LootBoxScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="LootBox"
        component={LootBoxScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
