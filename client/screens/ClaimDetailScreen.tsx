import React, { useEffect, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { format, parseISO } from "date-fns";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { userSettlementsApi, UserSettlement } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ClaimDetailRouteProp = RouteProp<RootStackParamList, "ClaimDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const statusOptions: { value: UserSettlement["status"]; label: string }[] = [
  { value: "NOT_FILED", label: "Not Filed" },
  { value: "FILED_PENDING", label: "Filed - Pending" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
];

export default function ClaimDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<ClaimDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { claimId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [claim, setClaim] = useState<UserSettlement | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [status, setStatus] = useState<UserSettlement["status"]>("NOT_FILED");

  useEffect(() => {
    loadClaim();
  }, [claimId]);

  const loadClaim = async () => {
    try {
      const claims = await userSettlementsApi.list();
      const foundClaim = claims.find((c) => c.id === claimId);
      if (foundClaim) {
        setClaim(foundClaim);
        setConfirmationNumber(foundClaim.claimConfirmationNumber || "");
        setNotes(foundClaim.notes || "");
        setPayoutAmount(foundClaim.payoutAmount || "");
        setStatus(foundClaim.status);
      }
    } catch (error) {
      console.error("Failed to load claim:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!claim) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await userSettlementsApi.update(claim.id, {
        status,
        claimConfirmationNumber: confirmationNumber || undefined,
        notes: notes || undefined,
        payoutAmount: payoutAmount || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Claim",
      "Are you sure you want to remove this claim from your list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!claim) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              await userSettlementsApi.delete(claim.id);
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete:", error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingSpinner message="Loading claim details..." />
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
          Claim not found
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: 120,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={[styles.settlementCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, Shadows.md]}>
          <ThemedText type="h4">{claim.settlement?.title || "Settlement"}</ThemedText>
          {claim.settlement?.category ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
              {claim.settlement.category}
            </ThemedText>
          ) : null}
          {claim.eligibilityResult ? (
            <View style={[styles.eligibilityBadge, {
              backgroundColor: claim.eligibilityResult === "LIKELY"
                ? `${theme.success}15`
                : claim.eligibilityResult === "POSSIBLE"
                ? `${theme.warning}15`
                : `${theme.error}15`
            }]}>
              <ThemedText type="small" style={{
                color: claim.eligibilityResult === "LIKELY"
                  ? theme.success
                  : claim.eligibilityResult === "POSSIBLE"
                  ? theme.warning
                  : theme.error,
                fontWeight: "600",
              }}>
                Eligibility: {claim.eligibilityResult}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Status
          </ThemedText>
          <View style={styles.statusOptions}>
            {statusOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStatus(option.value);
                }}
                style={[
                  styles.statusOption,
                  {
                    backgroundColor: status === option.value ? theme.primary : theme.backgroundDefault,
                    borderColor: status === option.value ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: status === option.value ? "#FFFFFF" : theme.text, fontWeight: "500" }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Confirmation Number
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
            value={confirmationNumber}
            onChangeText={setConfirmationNumber}
            placeholder="Enter confirmation number"
            placeholderTextColor={theme.textTertiary}
          />
        </View>

        {status === "PAID" ? (
          <View style={styles.section}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Payout Amount
            </ThemedText>
            <View style={[styles.inputWithIcon, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>$</ThemedText>
              <TextInput
                style={[styles.inputInner, { color: theme.text }]}
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Notes
          </ThemedText>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this claim..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {claim.settlement?.claimDeadline ? (
          <View style={[styles.infoRow, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={18} color={theme.textSecondary} />
            <View style={styles.infoContent}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Claim Deadline
              </ThemedText>
              <ThemedText type="body">
                {format(parseISO(claim.settlement.claimDeadline), "MMMM d, yyyy")}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: `${theme.error}10`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
          <ThemedText type="body" style={{ color: theme.error, marginLeft: Spacing.sm }}>
            Remove from My Claims
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.bottomBar, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.md, borderTopColor: theme.border }]}>
        <Button onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </View>
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
  settlementCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  eligibilityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statusOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  inputInner: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontSize: 16,
  },
  textArea: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 100,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    marginLeft: Spacing.md,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
  },
  saveButton: {
    width: "100%",
  },
});
