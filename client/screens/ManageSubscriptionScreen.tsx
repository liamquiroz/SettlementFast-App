import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  subscriptionApi,
  paygApi,
  SubscriptionPlan,
  Subscription,
  SubscriptionUsage,
  PaymentMethod,
} from "@/lib/api";

export default function ManageSubscriptionScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["/api/subscription"],
    queryFn: () => subscriptionApi.getCurrent(),
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/subscription/usage"],
    queryFn: () => subscriptionApi.getUsage(),
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: () => subscriptionApi.getPlans("individual"),
  });

  const { data: paymentMethods, isLoading: pmLoading } = useQuery({
    queryKey: ["/api/payg/payment-methods"],
    queryFn: () => paygApi.getPaymentMethods(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => subscriptionApi.createCheckout(planId),
    onSuccess: async (data) => {
      if (data.url) {
        await WebBrowser.openBrowserAsync(data.url);
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] });
      }
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to open checkout. Please try again.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Subscription Canceled", "Your subscription will end at the current billing period.");
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to cancel subscription. Please try again.");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => subscriptionApi.reactivate(),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Subscription Reactivated", "Your subscription has been reactivated.");
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to reactivate subscription. Please try again.");
    },
  });

  const billingPortalMutation = useMutation({
    mutationFn: () => subscriptionApi.billingPortal(),
    onSuccess: async (data) => {
      if (data.url) {
        await WebBrowser.openBrowserAsync(data.url);
      }
    },
    onError: () => {
      Alert.alert("Error", "Failed to open billing portal. Please try again.");
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => paygApi.deletePaymentMethod(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/payg/payment-methods"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete payment method.");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => paygApi.setDefaultPaymentMethod(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/payg/payment-methods"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to set default payment method.");
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/usage"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/payg/payment-methods"] }),
    ]);
    setIsRefreshing(false);
  };

  const handleUpgrade = (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkoutMutation.mutate(planId);
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel? You'll still have access until the end of your billing period.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const handleReactivate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reactivateMutation.mutate();
  };

  const handleManageBilling = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    billingPortalMutation.mutate();
  };

  const handleDeletePaymentMethod = (pm: PaymentMethod) => {
    Alert.alert(
      "Remove Card",
      `Remove ${pm.cardBrand?.toUpperCase() || "card"} ending in ${pm.cardLast4}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deletePaymentMethodMutation.mutate(pm.id),
        },
      ]
    );
  };

  const handleSetDefault = (pm: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefaultMutation.mutate(pm.id);
  };

  const isLoading = subLoading || usageLoading || plansLoading || pmLoading;

  const daysUntilReset = usage?.periodEnd
    ? differenceInDays(new Date(usage.periodEnd), new Date())
    : null;

  const usagePercent = usage && usage.includedClaims
    ? Math.min((usage.claimsUsed / usage.includedClaims) * 100, 100)
    : 0;

  const currentPlanId = subscription?.planId;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
      }
    >
      <View style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
            <Feather name="credit-card" size={20} color={theme.primary} />
          </View>
          <View style={styles.cardHeaderText}>
            <ThemedText type="h4">{usage?.planName || "Free Plan"}</ThemedText>
            {subscription?.plan?.priceMonthly ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                ${subscription.plan.priceMonthly}/month
              </ThemedText>
            ) : null}
          </View>
          {daysUntilReset !== null && daysUntilReset >= 0 ? (
            <View style={[styles.badge, { backgroundColor: `${theme.accent}20` }]}>
              <ThemedText type="small" style={{ color: theme.accent, fontWeight: "600", fontSize: 12 }}>
                {daysUntilReset} days left
              </ThemedText>
            </View>
          ) : null}
        </View>

        {usage?.periodStart && usage?.periodEnd ? (
          <View style={[styles.billingPeriod, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Billing period: {format(new Date(usage.periodStart), "MMM d")} -{" "}
              {format(new Date(usage.periodEnd), "MMM d, yyyy")}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.usageSection}>
          <View style={styles.usageHeader}>
            <ThemedText type="body" style={{ fontWeight: "500" }}>
              Claims Usage
            </ThemedText>
            {usage?.isUnlimited ? (
              <ThemedText type="small" style={{ color: theme.success }}>
                Unlimited
              </ThemedText>
            ) : (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {usage?.claimsUsed || 0} of {usage?.includedClaims || 0} used
              </ThemedText>
            )}
          </View>

          {!usage?.isUnlimited ? (
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${usagePercent}%`,
                    backgroundColor: usagePercent >= 90 ? theme.error : usagePercent >= 70 ? theme.warning : theme.success,
                  },
                ]}
              />
            </View>
          ) : null}

          {usage?.claimsRemaining !== null && !usage?.isUnlimited ? (
            <ThemedText type="small" style={{ color: theme.textTertiary, marginTop: Spacing.xs }}>
              {usage?.claimsRemaining} claims remaining
              {usage?.periodEnd ? ` · Resets ${format(new Date(usage.periodEnd), "MMM d")}` : ""}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          {subscription?.cancelAtPeriodEnd ? (
            <Pressable
              onPress={handleReactivate}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.success, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Reactivate Subscription
              </ThemedText>
            </Pressable>
          ) : subscription?.stripeSubscriptionId ? (
            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleManageBilling}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.7 : 1, flex: 1 },
                ]}
              >
                <Feather name="settings" size={16} color="#FFFFFF" style={{ marginRight: Spacing.xs }} />
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Manage Billing
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: `${theme.error}15`, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ThemedText type="body" style={{ color: theme.error, fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Available Plans
        </ThemedText>

        {plans?.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isFree = !plan.priceMonthly || plan.priceMonthly === "0";

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: isCurrentPlan ? theme.primary : theme.border,
                  borderWidth: isCurrentPlan ? 2 : 1,
                },
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <ThemedText type="h4">{plan.displayName}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {isFree
                      ? "Free forever"
                      : `$${plan.priceMonthly}/month`}
                  </ThemedText>
                </View>
                {isCurrentPlan ? (
                  <View style={[styles.currentBadge, { backgroundColor: `${theme.primary}15` }]}>
                    <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600", fontSize: 12 }}>
                      Current
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.planFeatures}>
                <View style={styles.featureRow}>
                  <Feather name="check" size={14} color={theme.success} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: theme.textSecondary }}>
                    {plan.isUnlimited
                      ? "Unlimited claims"
                      : `${plan.includedClaims} claims per month`}
                  </ThemedText>
                </View>
                {plan.features?.slice(0, 3).map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Feather
                      name={feature.type === "perk" ? "check" : "x"}
                      size={14}
                      color={feature.type === "perk" ? theme.success : theme.textTertiary}
                    />
                    <ThemedText
                      type="small"
                      style={{
                        marginLeft: Spacing.sm,
                        color: feature.type === "perk" ? theme.textSecondary : theme.textTertiary,
                      }}
                    >
                      {feature.text}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {!isCurrentPlan && !isFree ? (
                <Pressable
                  onPress={() => handleUpgrade(plan.id)}
                  disabled={checkoutMutation.isPending}
                  style={({ pressed }) => [
                    styles.upgradeButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: pressed || checkoutMutation.isPending ? 0.7 : 1,
                    },
                  ]}
                >
                  {checkoutMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                      {subscription?.plan?.priceMonthly && parseFloat(subscription.plan.priceMonthly) > parseFloat(plan.priceMonthly || "0")
                        ? "Downgrade"
                        : "Upgrade"}
                    </ThemedText>
                  )}
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Payment Methods
        </ThemedText>

        {paymentMethods && paymentMethods.length > 0 ? (
          paymentMethods.map((pm) => (
            <View
              key={pm.id}
              style={[styles.paymentCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <View style={styles.paymentInfo}>
                <View style={[styles.cardIcon, { backgroundColor: theme.backgroundDefault }]}>
                  <Feather name="credit-card" size={18} color={theme.text} />
                </View>
                <View style={styles.paymentDetails}>
                  <ThemedText type="body">
                    {pm.cardBrand?.toUpperCase() || "Card"} •••• {pm.cardLast4}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Expires {pm.cardExpMonth}/{pm.cardExpYear}
                  </ThemedText>
                </View>
                {pm.isDefault ? (
                  <View style={[styles.defaultBadge, { backgroundColor: `${theme.success}15` }]}>
                    <ThemedText type="small" style={{ color: theme.success, fontWeight: "600", fontSize: 12 }}>
                      Default
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <View style={styles.paymentActions}>
                {!pm.isDefault ? (
                  <Pressable
                    onPress={() => handleSetDefault(pm)}
                    style={({ pressed }) => [
                      styles.paymentActionBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.primary }}>
                      Set Default
                    </ThemedText>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => handleDeletePaymentMethod(pm)}
                  style={({ pressed }) => [
                    styles.paymentActionBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <ThemedText type="small" style={{ color: theme.error }}>
                    Remove
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Feather name="credit-card" size={32} color={theme.textTertiary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No payment methods saved
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textTertiary, textAlign: "center", marginTop: Spacing.xs }}>
              Add a payment method through the billing portal to manage your subscription
            </ThemedText>
          </View>
        )}

        {subscription?.stripeSubscriptionId ? (
          <Pressable
            onPress={handleManageBilling}
            style={({ pressed }) => [
              styles.addPaymentButton,
              { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary, marginLeft: Spacing.sm }}>
              Manage Payment Methods
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  billingPeriod: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  usageSection: {
    marginBottom: Spacing.lg,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  cardActions: {
    gap: Spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  planCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  planFeatures: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  upgradeButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  paymentCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  paymentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  paymentActionBtn: {
    padding: Spacing.xs,
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: "center",
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
});
