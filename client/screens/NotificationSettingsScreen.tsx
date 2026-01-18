import React, { useState } from "react";
import { StyleSheet, View, Switch, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface NotificationRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function NotificationRow({ title, description, value, onValueChange }: NotificationRowProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
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
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [newSettlements, setNewSettlements] = useState(true);
  const [claimUpdates, setClaimUpdates] = useState(true);

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
          PUSH NOTIFICATIONS
        </ThemedText>
        <NotificationRow
          title="Enable Notifications"
          description="Receive push notifications on your device"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          NOTIFICATION TYPES
        </ThemedText>
        <View style={[styles.group, { borderColor: theme.border }]}>
          <NotificationRow
            title="Deadline Reminders"
            description="Get reminded before claim deadlines"
            value={deadlineReminders}
            onValueChange={setDeadlineReminders}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <NotificationRow
            title="New Settlements"
            description="Get notified about new settlements matching your interests"
            value={newSettlements}
            onValueChange={setNewSettlements}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <NotificationRow
            title="Claim Updates"
            description="Receive updates about your filed claims"
            value={claimUpdates}
            onValueChange={setClaimUpdates}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  group: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg,
  },
});
