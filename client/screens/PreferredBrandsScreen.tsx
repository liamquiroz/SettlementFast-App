import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { exploreApi, userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function PreferredBrandsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const [brands, setBrands] = useState<string[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [initialBrands, setInitialBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredBrands(
        brands.filter(brand => 
          brand.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredBrands(brands);
    }
  }, [searchQuery, brands]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [brandsData, profileData] = await Promise.all([
        exploreApi.getBrands(),
        isAuthenticated ? userApi.getProfile().catch(() => null) : Promise.resolve(null),
      ]);
      setBrands(brandsData);
      setFilteredBrands(brandsData);
      if (profileData?.preferredBrands) {
        setSelectedBrands(profileData.preferredBrands);
        setInitialBrands(profileData.preferredBrands);
      }
    } catch (error) {
      console.error("Failed to load brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBrand = (brand: string) => {
    Haptics.selectionAsync();
    setSelectedBrands(prev => 
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const hasChanges = JSON.stringify(selectedBrands.sort()) !== JSON.stringify(initialBrands.sort());

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await userApi.updateProfile({ preferredBrands: selectedBrands });
      setInitialBrands(selectedBrands);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Your brand preferences have been updated.");
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
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
          Select brands you frequently use to get notified about relevant settlements.
        </ThemedText>

        <View style={[styles.searchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search brands..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {selectedBrands.length > 0 ? (
          <View style={styles.selectedSection}>
            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              SELECTED ({selectedBrands.length})
            </ThemedText>
            <View style={styles.brandsGrid}>
              {selectedBrands.map((brand) => (
                <Pressable
                  key={`selected-${brand}`}
                  onPress={() => toggleBrand(brand)}
                  style={[styles.brandChip, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF" }}>{brand}</ThemedText>
                  <Feather name="x" size={16} color="#FFFFFF" style={{ marginLeft: Spacing.xs }} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ALL BRANDS
          </ThemedText>
          <View style={styles.brandsGrid}>
            {filteredBrands.filter(b => !selectedBrands.includes(b)).map((brand) => (
              <Pressable
                key={brand}
                onPress={() => toggleBrand(brand)}
                style={[styles.brandChip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              >
                <ThemedText type="body">{brand}</ThemedText>
              </Pressable>
            ))}
          </View>
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
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  selectedSection: {
    marginBottom: Spacing.xl,
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
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
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
