import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BrowseScreen from "@/screens/BrowseScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type BrowseStackParamList = {
  Browse: undefined;
};

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export default function BrowseStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          headerTitle: "Browse Settlements",
        }}
      />
    </Stack.Navigator>
  );
}
