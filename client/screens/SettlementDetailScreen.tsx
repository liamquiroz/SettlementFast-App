import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable, Share, Linking, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { format, parseISO, differenceInDays } from "date-fns";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ClaimActionPanel } from "@/components/ClaimActionPanel";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";
import { settlementsApi, userSettlementsApi, Settlement, UserSettlement, EligibilityQuestion } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type SettlementDetailRouteProp = RouteProp<RootStackParamList, "SettlementDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettlementDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const route = useRoute<SettlementDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { slug } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [userClaim, setUserClaim] = useState<UserSettlement | null>(null);
  const [questions, setQuestions] = useState<EligibilityQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettlement();
  }, [slug]);

  const loadSettlement = async () => {
    try {
      const data = await settlementsApi.getBySlug(slug);
      setSettlement(data);

      try {
        const questionsData = await settlementsApi.getQuestions(slug);
        setQuestions(questionsData);
      } catch (e) {
        // No questions available
      }

      if (isAuthenticated) {
        try {
          const claim = await userSettlementsApi.getBySettlement(data.id);
          setUserClaim(claim);
        } catch (e) {
          // No claim exists
        }
      }
    } catch (error) {
      console.error("Failed to load settlement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settlement || !isAuthenticated) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (userClaim) {
        await userSettlementsApi.delete(userClaim.id);
        setUserClaim(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const newClaim = await userSettlementsApi.create({ settlementId: settlement.id });
        setUserClaim(newClaim);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!settlement) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: settlement.title,
        message: `Check out this settlement: ${settlement.title}\n\nPotential payout: ${formatPayout()}\n\n${settlement.claimWebsiteUrl || ""}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const handleOpenClaimForm = async () => {
    if (!settlement?.claimFormUrl) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(settlement.claimFormUrl);
  };

  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatPayout = () => {
    if (!settlement) return "Varies";
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

  const daysUntilDeadline = settlement?.claimDeadline
    ? differenceInDays(parseISO(settlement.claimDeadline), new Date())
    : null;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Loading settlement..." />
      </View>
    );
  }

  if (!settlement) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
          Settlement not found
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        <View style={styles.hero}>
          {settlement.logoUrl ? (
            <Image
              source={{ uri: settlement.logoUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: theme.primary }]}>
              <Feather name="file-text" size={60} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <LinearGradient
            colors={["transparent", theme.backgroundRoot]}
            style={styles.heroGradient}
          />
        </View>

        <View style={[styles.content, { marginTop: -60 }]}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: `${theme.primary}15` }]}>
              <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                {settlement.category}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: `${theme.success}15` }]}>
              <ThemedText type="small" style={{ color: theme.success, fontWeight: "600" }}>
                {settlement.status}
              </ThemedText>
            </View>
            {settlement.proofRequired ? (
              <View style={[styles.badge, { backgroundColor: `${theme.warning}15` }]}>
                <Feather name="file" size={10} color={theme.warning} />
                <ThemedText type="small" style={{ color: theme.warning, fontWeight: "600", marginLeft: 4 }}>
                  Proof Required
                </ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText type="h2" style={styles.title}>
            {settlement.title}
          </ThemedText>

          <View style={[styles.payoutCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, Shadows.md]}>
            <View style={styles.payoutMain}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Estimated Payout
              </ThemedText>
              <ThemedText type="h1" style={{ color: theme.primary }}>
                {formatPayout()}
              </ThemedText>
            </View>
            {daysUntilDeadline !== null && daysUntilDeadline >= 0 ? (
              <View style={[styles.deadlineBox, { backgroundColor: daysUntilDeadline <= 7 ? `${theme.error}15` : `${theme.warning}15` }]}>
                <ThemedText
                  type="h3"
                  style={{ color: daysUntilDeadline <= 7 ? theme.error : theme.warning }}
                >
                  {daysUntilDeadline}
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ color: daysUntilDeadline <= 7 ? theme.error : theme.warning }}
                >
                  days left
                </ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
            {settlement.fullDescription || settlement.shortDescription}
          </ThemedText>

          {settlement.keyRequirements?.length > 0 ? (
            <Pressable
              onPress={() => toggleSection("requirements")}
              style={[styles.accordion, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <View style={styles.accordionHeader}>
                <Feather name="check-circle" size={20} color={theme.primary} />
                <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.md, fontWeight: "600" }}>
                  Eligibility Requirements
                </ThemedText>
                <Feather
                  name={expandedSections.requirements ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
              {expandedSections.requirements ? (
                <View style={styles.accordionContent}>
                  {settlement.keyRequirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <View style={[styles.bulletPoint, { backgroundColor: theme.primary }]} />
                      <ThemedText type="small" style={{ flex: 1, color: theme.textSecondary }}>
                        {req}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          ) : null}

          {settlement.dateRangeStart || settlement.dateRangeEnd ? (
            <View style={[styles.infoCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Feather name="calendar" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Qualifying Period
                </ThemedText>
                <ThemedText type="body">
                  {settlement.dateRangeStart
                    ? format(parseISO(settlement.dateRangeStart), "MMM d, yyyy")
                    : "Unknown"}{" "}
                  -{" "}
                  {settlement.dateRangeEnd
                    ? format(parseISO(settlement.dateRangeEnd), "MMM d, yyyy")
                    : "Unknown"}
                </ThemedText>
              </View>
            </View>
          ) : null}

          {settlement.claimDeadline ? (
            <View style={[styles.infoCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Feather name="clock" size={20} color={theme.warning} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Claim Deadline
                </ThemedText>
                <ThemedText type="body">
                  {format(parseISO(settlement.claimDeadline), "MMMM d, yyyy")}
                </ThemedText>
              </View>
            </View>
          ) : null}

          {settlement.brands?.length > 0 ? (
            <View style={styles.brandsSection}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                Related Brands
              </ThemedText>
              <View style={styles.brandsList}>
                {settlement.brands.map((brand, index) => (
                  <View key={index} style={[styles.brandChip, { backgroundColor: theme.backgroundDefault }]}>
                    <ThemedText type="small">{brand}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: Spacing.xl }}>
            <ClaimActionPanel
              settlement={settlement}
              questions={questions}
              userSettlement={userClaim}
              isDeadlinePassed={daysUntilDeadline !== null && daysUntilDeadline < 0}
              onClaimSaved={(claim) => setUserClaim(claim)}
            />
          </View>

          <View style={styles.shareSection}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareButton,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="share" size={18} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                Share this settlement
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    height: 200,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  payoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  payoutMain: {},
  deadlineBox: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minWidth: 70,
  },
  description: {
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  accordion: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  accordionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: Spacing.sm,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  infoContent: {
    marginLeft: Spacing.md,
  },
  brandsSection: {
    marginTop: Spacing.md,
  },
  brandsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  brandChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  shareSection: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
});
