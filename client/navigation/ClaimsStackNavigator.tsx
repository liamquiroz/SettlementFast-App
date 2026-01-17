import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ClaimsScreen from "@/screens/ClaimsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ClaimsStackParamList = {
  Claims: undefined;
};

const Stack = createNativeStackNavigator<ClaimsStackParamList>();

export default function ClaimsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Claims"
        component={ClaimsScreen}
        options={{
          headerTitle: "My Claims",
        }}
      />
    </Stack.Navigator>
  );
}
