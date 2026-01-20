import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";

import MainTabNavigator, { MainTabParamList } from "@/navigation/MainTabNavigator";
import SettlementDetailScreen from "@/screens/SettlementDetailScreen";
import ClaimDetailScreen from "@/screens/ClaimDetailScreen";
import LoginScreen from "@/screens/LoginScreen";
import EmailPreferencesScreen from "@/screens/EmailPreferencesScreen";
import PreferredCategoriesScreen from "@/screens/PreferredCategoriesScreen";
import PreferredBrandsScreen from "@/screens/PreferredBrandsScreen";
import ManageSubscriptionScreen from "@/screens/ManageSubscriptionScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Login: undefined;
  SettlementDetail: { slug: string };
  ClaimDetail: { claimId: string };
  EmailPreferences: undefined;
  PreferredCategories: undefined;
  PreferredBrands: undefined;
  ManageSubscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettlementDetail"
        component={SettlementDetailScreen}
        options={{
          headerTitle: "Settlement",
          headerTransparent: true,
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="ClaimDetail"
        component={ClaimDetailScreen}
        options={{
          headerTitle: "Edit Claim",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmailPreferences"
        component={EmailPreferencesScreen}
        options={{
          headerTitle: "Email Preferences",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="PreferredCategories"
        component={PreferredCategoriesScreen}
        options={{
          headerTitle: "Categories",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="PreferredBrands"
        component={PreferredBrandsScreen}
        options={{
          headerTitle: "Brands",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="ManageSubscription"
        component={ManageSubscriptionScreen}
        options={{
          headerTitle: "Manage Plan",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
}
