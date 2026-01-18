import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { exploreApi, CategoryWithCount } from "@/lib/api";

export default function PreferredCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await exploreApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    Haptics.selectionAsync();
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

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
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
        Select categories you're interested in to get personalized settlement recommendations.
      </ThemedText>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.name);
          return (
            <Pressable
              key={category.name}
              onPress={() => toggleCategory(category.name)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.surfaceElevated,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              {isSelected ? (
                <Feather name="check" size={16} color="#FFFFFF" style={styles.checkIcon} />
              ) : null}
              <ThemedText 
                type="body" 
                style={{ color: isSelected ? "#FFFFFF" : theme.text }}
              >
                {category.name}
              </ThemedText>
              <ThemedText 
                type="small" 
                style={{ 
                  color: isSelected ? "rgba(255,255,255,0.7)" : theme.textTertiary,
                  marginLeft: Spacing.xs 
                }}
              >
                ({category.count})
              </ThemedText>
            </Pressable>
          );
        })}
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
  description: {
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  checkIcon: {
    marginRight: Spacing.xs,
  },
});
