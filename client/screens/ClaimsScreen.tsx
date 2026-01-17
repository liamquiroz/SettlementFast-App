import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl, SectionList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ClaimCard } from "@/components/ClaimCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { userSettlementsApi, UserSettlement } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClaimSection {
  title: string;
  data: UserSettlement[];
}

export default function ClaimsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claims, setClaims] = useState<UserSettlement[]>([]);

  const loadClaims = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await userSettlementsApi.list();
      setClaims(data);
    } catch (error) {
      console.error("Failed to load claims:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClaims();
    }, [isAuthenticated])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadClaims();
  };

  const groupClaimsByStatus = (): ClaimSection[] => {
    const groups: Record<string, UserSettlement[]> = {
      NOT_FILED: [],
      FILED_PENDING: [],
      PAID: [],
      REJECTED: [],
    };

    claims.forEach((claim) => {
      const status = claim.status || "NOT_FILED";
      if (groups[status]) {
        groups[status].push(claim);
      } else {
        groups.NOT_FILED.push(claim);
      }
    });

    const sections: ClaimSection[] = [];
    if (groups.NOT_FILED.length > 0) {
      sections.push({ title: "Not Filed", data: groups.NOT_FILED });
    }
    if (groups.FILED_PENDING.length > 0) {
      sections.push({ title: "Filed - Pending", data: groups.FILED_PENDING });
    }
    if (groups.PAID.length > 0) {
      sections.push({ title: "Paid", data: groups.PAID });
    }
    if (groups.REJECTED.length > 0) {
      sections.push({ title: "Rejected", data: groups.REJECTED });
    }

    return sections;
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <EmptyState
          image={require("../../assets/images/empty-states/empty-claims.png")}
          title="Sign in to track claims"
          message="Create an account to save settlements and track your claim status."
          actionLabel="Sign In"
          onAction={() => {}}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Loading your claims..." />
      </View>
    );
  }

  const sections = groupClaimsByStatus();

  if (sections.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <EmptyState
          image={require("../../assets/images/empty-states/empty-claims.png")}
          title="No claims yet"
          message="Start browsing settlements to find ones you may qualify for."
          actionLabel="Browse Settlements"
          onAction={() => navigation.navigate("Main", { screen: "BrowseTab" } as never)}
        />
      </View>
    );
  }

  return (
    <SectionList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ClaimCard
          claim={item}
          onPress={() => navigation.navigate("ClaimDetail", { claimId: item.id })}
        />
      )}
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundRoot }]}>
          <ThemedText type="h4">{section.title}</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {section.data.length}
            </ThemedText>
          </View>
        </View>
      )}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
    />
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  countBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
});
