import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { SettlementCard } from "@/components/SettlementCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { dashboardApi, settlementsApi, DashboardStats, Settlement } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { profile, isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingSettlements, setUpcomingSettlements] = useState<Settlement[]>([]);
  const [recommendedSettlements, setRecommendedSettlements] = useState<Settlement[]>([]);

  const loadData = async () => {
    try {
      const [deadlines, settlements] = await Promise.all([
        settlementsApi.getUpcomingDeadlines(14),
        settlementsApi.list({ limit: 5 }),
      ]);
      setUpcomingSettlements(deadlines.slice(0, 3));
      setRecommendedSettlements(settlements);

      if (isAuthenticated) {
        try {
          const dashboardStats = await dashboardApi.getStats();
          setStats(dashboardStats);
        } catch (e) {
          console.log("Could not load stats:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Loading your dashboard..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="h2">
            {getGreeting()}{profile?.firstName ? `, ${profile.firstName}` : ""}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Find settlements you may qualify for
          </ThemedText>
        </View>
      </View>

      {isAuthenticated && stats ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContainer}
        >
          <StatCard
            title="Total Claims"
            value={stats.totalClaims}
            icon="file-text"
            delay={0}
          />
          <StatCard
            title="Active Claims"
            value={stats.activeClaims}
            icon="clock"
            color={theme.warning}
            delay={100}
          />
          <StatCard
            title="Est. Payout"
            value={stats.totalEstimatedPayout.toLocaleString()}
            icon="dollar-sign"
            color={theme.success}
            prefix="$"
            delay={200}
          />
          <StatCard
            title="Received"
            value={stats.totalReceived.toLocaleString()}
            icon="check-circle"
            color={theme.primary}
            prefix="$"
            delay={300}
          />
        </ScrollView>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Expiring Soon</ThemedText>
          <Pressable
            onPress={() => navigation.navigate("Main", { screen: "BrowseTab" } as never)}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>
              View All
            </ThemedText>
          </Pressable>
        </View>
        {upcomingSettlements.length > 0 ? (
          upcomingSettlements.map((settlement) => (
            <SettlementCard
              key={settlement.id}
              settlement={settlement}
              onPress={() => navigation.navigate("SettlementDetail", { slug: settlement.slug })}
            />
          ))
        ) : (
          <View style={[styles.emptySection, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={24} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              No urgent deadlines
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">New Settlements</ThemedText>
          <Pressable
            onPress={() => navigation.navigate("Main", { screen: "BrowseTab" } as never)}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>
              View All
            </ThemedText>
          </Pressable>
        </View>
        {recommendedSettlements.map((settlement) => (
          <SettlementCard
            key={settlement.id}
            settlement={settlement}
            onPress={() => navigation.navigate("SettlementDetail", { slug: settlement.slug })}
          />
        ))}
      </View>

      <View style={styles.quickActions}>
        <ThemedText type="h3" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              Shadows.sm,
            ]}
            onPress={() => navigation.navigate("Main", { screen: "BrowseTab" } as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="search" size={24} color={theme.primary} />
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>Browse</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Find settlements
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              Shadows.sm,
            ]}
            onPress={() => navigation.navigate("Main", { screen: "ClaimsTab" } as never)}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${theme.accent}15` }]}>
              <Feather name="file-text" size={24} color={theme.accent} />
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>My Claims</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Track your claims
            </ThemedText>
          </Pressable>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statsScroll: {
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptySection: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  quickActions: {
    paddingHorizontal: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
});
