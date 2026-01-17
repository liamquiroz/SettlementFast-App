import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { SettlementCard } from "@/components/SettlementCard";
import { SearchInput } from "@/components/SearchInput";
import { FilterChip } from "@/components/FilterChip";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { settlementsApi, exploreApi, Settlement } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = ["All", "Consumer", "Employment", "Data Breach", "Securities", "Product Liability"];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(CATEGORIES);

  const loadCategories = async () => {
    try {
      const apiCategories = await exploreApi.getCategories();
      if (apiCategories.length > 0) {
        setCategories(["All", ...apiCategories]);
      }
    } catch (error) {
      console.log("Using default categories");
    }
  };

  const loadSettlements = useCallback(async () => {
    try {
      const params: { search?: string; category?: string } = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== "All") params.category = selectedCategory;

      const data = await settlementsApi.list(params);
      setSettlements(data);
    } catch (error) {
      console.error("Failed to load settlements:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadSettlements();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [loadSettlements]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadSettlements();
  };

  const handleCategoryPress = (category: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search settlements..."
      />
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
        renderItem={({ item }) => (
          <FilterChip
            label={item}
            selected={selectedCategory === item}
            onPress={() => handleCategoryPress(item)}
          />
        )}
      />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-states/empty-search.png")}
      title="No settlements found"
      message="Try adjusting your search or filters to find more settlements."
      actionLabel="Clear Filters"
      onAction={() => {
        setSearchQuery("");
        setSelectedCategory("All");
      }}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Loading settlements..." />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={settlements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SettlementCard
          settlement={item}
          onPress={() => navigation.navigate("SettlementDetail", { slug: item.slug })}
        />
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
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
  headerContent: {
    marginBottom: Spacing.lg,
  },
  categoriesScroll: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
  },
});
