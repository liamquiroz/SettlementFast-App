import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { format, differenceInDays, parseISO } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { LogoContainer } from "@/components/LogoContainer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Settlement } from "@/lib/api";

interface SettlementCardProps {
  settlement: Settlement;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettlementCard({ settlement, onPress }: SettlementCardProps) {
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

  const daysUntilDeadline = settlement.claimDeadline
    ? differenceInDays(parseISO(settlement.claimDeadline), new Date())
    : null;

  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7;

  const formatPayout = () => {
    if (settlement.payoutMinEstimate && settlement.payoutMaxEstimate) {
      return `$${settlement.payoutMinEstimate} - $${settlement.payoutMaxEstimate}`;
    }
    if (settlement.payoutMaxEstimate) {
      return `Up to $${settlement.payoutMaxEstimate}`;
    }
    if (settlement.payoutMinEstimate) {
      return `From $${settlement.payoutMinEstimate}`;
    }
    return "Varies";
  };

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
        <LogoContainer logoUrl={settlement.logoUrl} size="medium" />
        <View style={styles.headerText}>
          <ThemedText type="h4" numberOfLines={2} style={styles.title}>
            {settlement.title}
          </ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: `${theme.primary}15` }]}>
              <ThemedText
                type="small"
                style={[styles.badgeText, { color: theme.primary }]}
              >
                {settlement.category}
              </ThemedText>
            </View>
            {settlement.proofRequired ? (
              <View style={[styles.badge, { backgroundColor: `${theme.warning}15` }]}>
                <Feather name="file" size={10} color={theme.warning} />
                <ThemedText
                  type="small"
                  style={[styles.badgeText, { color: theme.warning, marginLeft: 4 }]}
                >
                  Proof Required
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ThemedText
        type="small"
        numberOfLines={2}
        style={[styles.description, { color: theme.textSecondary }]}
      >
        {settlement.shortDescription}
      </ThemedText>

      <View style={styles.footer}>
        <View style={styles.payout}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Payout
          </ThemedText>
          <ThemedText type="h4" style={{ color: theme.primary }}>
            {formatPayout()}
          </ThemedText>
        </View>

        {settlement.claimDeadline ? (
          <View style={styles.deadline}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Deadline
            </ThemedText>
            <View style={styles.deadlineValue}>
              {isUrgent ? (
                <Feather name="alert-circle" size={14} color={theme.error} />
              ) : null}
              <ThemedText
                type="small"
                style={[
                  styles.deadlineText,
                  { color: isUrgent ? theme.error : theme.text },
                ]}
              >
                {daysUntilDeadline !== null && daysUntilDeadline >= 0
                  ? `${daysUntilDeadline} days`
                  : format(parseISO(settlement.claimDeadline), "MMM d, yyyy")}
              </ThemedText>
            </View>
          </View>
        ) : null}
      </View>
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
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  description: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  payout: {},
  deadline: {
    alignItems: "flex-end",
  },
  deadlineValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deadlineText: {
    fontWeight: "500",
  },
});
