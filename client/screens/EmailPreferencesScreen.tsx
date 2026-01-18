import React, { useState, useEffect } from "react";
import { StyleSheet, View, Switch, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { userApi, UserProfile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface EmailRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function EmailRow({ title, description, value, onValueChange, disabled }: EmailRowProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceElevated, opacity: disabled ? 0.6 : 1 }]}>
      <View style={styles.rowContent}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>{title}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => {
          Haptics.selectionAsync();
          onValueChange(val);
        }}
        trackColor={{ false: theme.backgroundTertiary, true: `${theme.primary}80` }}
        thumbColor={value ? theme.primary : theme.backgroundDefault}
        disabled={disabled}
      />
    </View>
  );
}

export default function EmailPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailWeeklyDigest: true,
    emailDeadlineReminders: true,
    emailNewSettlements: true,
    emailClaimUpdates: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getEmailPreferences();
      setPreferences({
        emailWeeklyDigest: data.emailWeeklyDigest ?? true,
        emailDeadlineReminders: data.emailDeadlineReminders ?? true,
        emailNewSettlements: data.emailNewSettlements ?? true,
        emailClaimUpdates: data.emailClaimUpdates ?? true,
      });
    } catch (error) {
      console.log("Could not load email preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof typeof preferences, value: boolean) => {
    const previousValue = preferences[key];
    setPreferences(prev => ({ ...prev, [key]: value }));

    try {
      setIsSaving(true);
      await userApi.updateEmailPreferences({ [key]: value });
    } catch (error) {
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      Alert.alert("Error", "Could not update preference. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          EMAIL NOTIFICATIONS
        </ThemedText>
        <View style={[styles.group, { borderColor: theme.border, borderWidth: 1 }]}>
          <EmailRow
            title="Weekly Digest"
            description="A summary of new settlements and your claim status"
            value={preferences.emailWeeklyDigest}
            onValueChange={(val) => updatePreference("emailWeeklyDigest", val)}
            disabled={isSaving}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="Deadline Reminders"
            description="Email reminders before claim deadlines"
            value={preferences.emailDeadlineReminders}
            onValueChange={(val) => updatePreference("emailDeadlineReminders", val)}
            disabled={isSaving}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="New Settlements"
            description="Get emailed about new settlements matching your interests"
            value={preferences.emailNewSettlements}
            onValueChange={(val) => updatePreference("emailNewSettlements", val)}
            disabled={isSaving}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="Claim Updates"
            description="Receive email updates about your filed claims"
            value={preferences.emailClaimUpdates}
            onValueChange={(val) => updatePreference("emailClaimUpdates", val)}
            disabled={isSaving}
          />
        </View>
      </View>

      <ThemedText type="small" style={[styles.note, { color: theme.textTertiary }]}>
        You can unsubscribe from any email by clicking the unsubscribe link at the bottom of each email.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  group: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg,
  },
  note: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
});
