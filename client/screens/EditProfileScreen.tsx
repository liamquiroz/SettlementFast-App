import React, { useState } from "react";
import { StyleSheet, View, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const navigation = useNavigation();
  
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your profile has been updated.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Email
          </ThemedText>
          <View style={[styles.disabledInput, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {user?.email}
            </ThemedText>
          </View>
          <ThemedText type="small" style={[styles.hint, { color: theme.textTertiary }]}>
            Email cannot be changed
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            First Name
          </ThemedText>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surfaceElevated, 
              borderColor: theme.border,
              color: theme.text 
            }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Last Name
          </ThemedText>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surfaceElevated, 
              borderColor: theme.border,
              color: theme.text 
            }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <Button 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  disabledInput: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
