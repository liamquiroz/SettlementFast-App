import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { exploreApi, userApi, CategoryWithCount } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function PreferredCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialCategories, setInitialCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesData, profileData] = await Promise.all([
        exploreApi.getCategories(),
        isAuthenticated ? userApi.getProfile().catch(() => null) : Promise.resolve(null),
      ]);
      setCategories(categoriesData);
      if (profileData?.preferredCategories) {
        setSelectedCategories(profileData.preferredCategories);
        setInitialCategories(profileData.preferredCategories);
      }
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

  const hasChanges = JSON.stringify(selectedCategories.sort()) !== JSON.stringify(initialCategories.sort());

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await userApi.updateProfile({ preferredCategories: selectedCategories });
      setInitialCategories(selectedCategories);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Your category preferences have been updated.");
    } catch (error) {
      Alert.alert("Error", "Could not save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: Spacing.xl,
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

      {hasChanges ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot }]}>
          <Button 
            onPress={handleSave} 
            disabled={isSaving}
            style={styles.saveButton}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </View>
      ) : null}
    </View>
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
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  saveButton: {
    width: "100%",
  },
});
