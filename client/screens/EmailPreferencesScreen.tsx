import React, { useState } from "react";
import { StyleSheet, View, Switch, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface EmailRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function EmailRow({ title, description, value, onValueChange }: EmailRowProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceElevated }]}>
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

export default function EmailPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [newSettlements, setNewSettlements] = useState(true);
  const [claimUpdates, setClaimUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

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
            value={weeklyDigest}
            onValueChange={setWeeklyDigest}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="Deadline Reminders"
            description="Email reminders before claim deadlines"
            value={deadlineReminders}
            onValueChange={setDeadlineReminders}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="New Settlements"
            description="Get emailed about new settlements matching your interests"
            value={newSettlements}
            onValueChange={setNewSettlements}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="Claim Updates"
            description="Receive email updates about your filed claims"
            value={claimUpdates}
            onValueChange={setClaimUpdates}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <EmailRow
            title="Promotions & Tips"
            description="Occasional tips and promotional content"
            value={promotions}
            onValueChange={setPromotions}
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
