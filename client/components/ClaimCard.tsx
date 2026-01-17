import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { UserSettlement } from "@/lib/api";

interface ClaimCardProps {
  claim: UserSettlement;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const statusConfig = {
  NOT_FILED: { label: "Not Filed", icon: "clock" as const, colorKey: "statusNotFiled" as const },
  FILED_PENDING: { label: "Filed - Pending", icon: "loader" as const, colorKey: "statusFiledPending" as const },
  PAID: { label: "Paid", icon: "check-circle" as const, colorKey: "statusPaid" as const },
  REJECTED: { label: "Rejected", icon: "x-circle" as const, colorKey: "statusRejected" as const },
  UNKNOWN: { label: "Unknown", icon: "help-circle" as const, colorKey: "statusNotFiled" as const },
};

export function ClaimCard({ claim, onPress }: ClaimCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const status = statusConfig[claim.status] || statusConfig.UNKNOWN;
  const statusColor = theme[status.colorKey];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
        Shadows.md,
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText type="h4" numberOfLines={2}>
            {claim.settlement?.title || "Settlement"}
          </ThemedText>
          {claim.settlement?.category ? (
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
            >
              {claim.settlement.category}
            </ThemedText>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <Feather name={status.icon} size={12} color={statusColor} />
          <ThemedText
            type="small"
            style={[styles.statusText, { color: statusColor }]}
          >
            {status.label}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        {claim.claimConfirmationNumber ? (
          <View style={styles.detailRow}>
            <Feather name="hash" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {claim.claimConfirmationNumber}
            </ThemedText>
          </View>
        ) : null}

        {claim.settlement?.claimDeadline ? (
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Deadline: {format(parseISO(claim.settlement.claimDeadline), "MMM d, yyyy")}
            </ThemedText>
          </View>
        ) : null}

        {claim.payoutAmount ? (
          <View style={styles.detailRow}>
            <Feather name="dollar-sign" size={14} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, fontWeight: "600" }}>
              ${claim.payoutAmount} received
            </ThemedText>
          </View>
        ) : null}
      </View>

      {claim.eligibilityResult ? (
        <View style={styles.eligibility}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Eligibility:{" "}
            <ThemedText
              type="small"
              style={{
                color:
                  claim.eligibilityResult === "LIKELY"
                    ? theme.success
                    : claim.eligibilityResult === "POSSIBLE"
                    ? theme.warning
                    : theme.error,
                fontWeight: "600",
              }}
            >
              {claim.eligibilityResult}
            </ThemedText>
          </ThemedText>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  details: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  eligibility: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
