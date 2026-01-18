import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import SettlementDetailScreen from "@/screens/SettlementDetailScreen";
import ClaimDetailScreen from "@/screens/ClaimDetailScreen";
import LoginScreen from "@/screens/LoginScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import EmailPreferencesScreen from "@/screens/EmailPreferencesScreen";
import PreferredCategoriesScreen from "@/screens/PreferredCategoriesScreen";
import PreferredBrandsScreen from "@/screens/PreferredBrandsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  SettlementDetail: { slug: string };
  ClaimDetail: { claimId: string };
  EditProfile: undefined;
  NotificationSettings: undefined;
  EmailPreferences: undefined;
  PreferredCategories: undefined;
  PreferredBrands: undefined;
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
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerTitle: "Edit Profile",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerTitle: "Notifications",
          headerBackTitle: "Back",
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
    </Stack.Navigator>
  );
}
