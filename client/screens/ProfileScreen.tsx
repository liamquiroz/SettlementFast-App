import React from "react";
import { StyleSheet, View, Pressable, Image, Alert, Switch, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  color?: string;
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  color,
}: SettingsItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={isSwitch}
      style={({ pressed }) => [
        styles.settingsItem,
        { backgroundColor: theme.surfaceElevated, opacity: pressed && onPress ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: `${color || theme.primary}15` }]}>
        <Feather name={icon} size={18} color={color || theme.primary} />
      </View>
      <View style={styles.settingsContent}>
        <ThemedText type="body">{label}</ThemedText>
        {value ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {value}
          </ThemedText>
        ) : null}
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(val) => {
            Haptics.selectionAsync();
            onSwitchChange?.(val);
          }}
          trackColor={{ false: theme.backgroundTertiary, true: `${theme.primary}80` }}
          thumbColor={switchValue ? theme.primary : theme.backgroundDefault}
        />
      ) : onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Login");
  };

  const handleCopyReferralCode = async () => {
    if (profile?.referralCode) {
      await Clipboard.setStringAsync(profile.referralCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied!", "Referral code copied to clipboard");
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <View style={styles.notAuthenticatedContainer}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="user" size={40} color={theme.textSecondary} />
          </View>
          <ThemedText type="h3" style={styles.notAuthTitle}>
            Sign in to your account
          </ThemedText>
          <ThemedText type="small" style={[styles.notAuthSubtitle, { color: theme.textSecondary }]}>
            Track your claims and get personalized recommendations
          </ThemedText>
          <Button onPress={handleSignIn} style={styles.signInButton} testID="button-sign-in">
            Sign In
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, Shadows.md]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
            {(profile?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="h4">
            {profile?.firstName
              ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
              : "User"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {user?.email}
          </ThemedText>
        </View>
      </View>

      {profile?.referralCode ? (
        <View style={[styles.referralCard, { backgroundColor: `${theme.primary}10`, borderColor: theme.primary }]}>
          <View style={styles.referralContent}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Your Referral Code
            </ThemedText>
            <ThemedText type="h4" style={{ color: theme.primary }}>
              {profile.referralCode}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleCopyReferralCode}
            style={({ pressed }) => [
              styles.copyButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="copy" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ACCOUNT
        </ThemedText>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <SettingsItem
            icon="user"
            label="Edit Profile"
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="bell"
            label="Notifications"
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="mail"
            label="Email Preferences"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PREFERENCES
        </ThemedText>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <SettingsItem
            icon="tag"
            label="Preferred Categories"
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="shopping-bag"
            label="Preferred Brands"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          SUPPORT
        </ThemedText>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <SettingsItem
            icon="help-circle"
            label="Help Center"
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="message-circle"
            label="Contact Support"
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="file-text"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="file"
            label="Terms of Service"
            onPress={() => {}}
          />
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.signOutButton,
          { backgroundColor: `${theme.error}10`, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="log-out" size={18} color={theme.error} />
        <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
          Sign Out
        </ThemedText>
      </Pressable>

      <ThemedText type="small" style={[styles.version, { color: theme.textTertiary }]}>
        SettlementFast v1.0.0
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notAuthenticatedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  notAuthTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  notAuthSubtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  signInButton: {
    minWidth: 160,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  referralContent: {
    flex: 1,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  settingsGroup: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  version: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
});
