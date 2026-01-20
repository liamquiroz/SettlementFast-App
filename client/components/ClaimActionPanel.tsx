import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  Settlement,
  EligibilityQuestion,
  UserSettlement,
  userSettlementsApi,
} from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClaimActionPanelProps {
  settlement: Settlement;
  questions?: EligibilityQuestion[];
  userSettlement?: UserSettlement | null;
  isDeadlinePassed?: boolean;
  onClaimSaved?: (claim: UserSettlement) => void;
}

export function ClaimActionPanel({
  settlement,
  questions = [],
  userSettlement,
  isDeadlinePassed = false,
  onClaimSaved,
}: ClaimActionPanelProps) {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [hasClickedFileForm, setHasClickedFileForm] = useState(false);
  const [isTracking, setIsTracking] = useState(!!userSettlement);
  const [isSaving, setIsSaving] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [eligibilityAnswers, setEligibilityAnswers] = useState<
    Record<string, string>
  >({});
  const [claimConfirmationNumber, setClaimConfirmationNumber] = useState("");

  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsTracking(!!userSettlement);
  }, [userSettlement]);

  useEffect(() => {
    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, []);

  const clearReminderInterval = useCallback(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }, []);

  const startReminderInterval = useCallback(() => {
    clearReminderInterval();
    reminderIntervalRef.current = setInterval(() => {
      if (!isTracking) {
        setShowReminderModal(true);
      } else {
        clearReminderInterval();
      }
    }, 10000);
  }, [isTracking, clearReminderInterval]);

  const openClaimForm = async () => {
    if (!settlement.claimFormUrl) return;

    try {
      await WebBrowser.openBrowserAsync(settlement.claimFormUrl);
      setHasClickedFileForm(true);
      if (!isTracking) {
        startReminderInterval();
      }
    } catch (error) {
      console.error("Failed to open claim form:", error);
    }
  };

  const handleFileClaimPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to file a claim.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    if (questions.length > 0 && !hasClickedFileForm) {
      setShowEligibilityModal(true);
    } else {
      openClaimForm();
    }
  };

  const handleSaveTrack = async (): Promise<boolean> => {
    console.log("[ClaimActionPanel] handleSaveTrack called");
    console.log("[ClaimActionPanel] isAuthenticated:", isAuthenticated);
    console.log("[ClaimActionPanel] isTracking:", isTracking);
    console.log("[ClaimActionPanel] settlementId:", settlement.id);


    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to track claims.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ]);
      return false;
    }

    if (isTracking) {
      console.log("[ClaimActionPanel] Already tracking, returning early");
      return true;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("[ClaimActionPanel] Calling userSettlementsApi.create...");
      const newClaim = await userSettlementsApi.create({
        settlementId: settlement.id,
        eligibilityResult: "POSSIBLE",
        eligibilityAnswers,
      });
      console.log("[ClaimActionPanel] Claim created successfully:", newClaim);

      setIsTracking(true);
      clearReminderInterval();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "You're now tracking this settlement claim.");
      onClaimSaved?.(newClaim);
      return true;
    } catch (error: unknown) {
      console.error("[ClaimActionPanel] Error saving claim:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[ClaimActionPanel] Error message:", errorMessage);

      if (errorMessage.includes("LIMIT_REACHED")) {
        Alert.alert(
          "Claim Limit Reached",
          "You've used all your available claims. Upgrade your plan to save more claims."
        );
      } else {
        Alert.alert("Error", `Failed to save claim: ${errorMessage}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisitWebsite = async () => {
    if (!settlement.claimWebsiteUrl) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await WebBrowser.openBrowserAsync(settlement.claimWebsiteUrl);
    } catch (error) {
      console.error("Failed to open website:", error);
    }
  };

  const handleViewClaims = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Main", { screen: "ClaimsTab" });
  };

  const handleEligibilityAnswer = (questionId: string, answer: string) => {
    Haptics.selectionAsync();
    setEligibilityAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleEligibilityNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowEligibilityModal(false);
      setCurrentQuestionIndex(0);
      openClaimForm();
    }
  };

  const handleSkipEligibility = () => {
    setShowEligibilityModal(false);
    setCurrentQuestionIndex(0);
    openClaimForm();
  };

  const handleReminderSave = async () => {
    console.log("[ClaimActionPanel] Reminder modal Save & Track button pressed");
    const success = await handleSaveTrack();
    if (success) {
      setShowReminderModal(false);
    }
  };

  const canVisitWebsite =
    hasClickedFileForm && isTracking && !!settlement.claimWebsiteUrl;
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? eligibilityAnswers[currentQuestion.id]
    : undefined;

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}
      >
        <View style={styles.unauthContent}>
          <Feather name="log-in" size={32} color={theme.primary} />
          <ThemedText
            type="h3"
            style={{ marginTop: Spacing.md, textAlign: "center" }}
          >
            Sign in to Track This Settlement
          </ThemedText>
          <ThemedText
            type="body"
            style={{
              color: theme.textSecondary,
              textAlign: "center",
              marginTop: Spacing.sm,
            }}
          >
            Create an account or sign in to save and track your settlement
            claims.
          </ThemedText>
          <Pressable
            testID="button-login-to-track"
            onPress={() => navigation.navigate("Login")}
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Sign In to Continue
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}
    >
      <Pressable
        testID="button-file-claim-form"
        onPress={handleFileClaimPress}
        disabled={isDeadlinePassed || !settlement.claimFormUrl}
        style={({ pressed }) => [
          styles.button,
          styles.greenButton,
          {
            opacity:
              pressed || isDeadlinePassed || !settlement.claimFormUrl
                ? 0.7
                : 1,
          },
        ]}
      >
        <Feather name="external-link" size={18} color="#FFFFFF" />
        <ThemedText type="body" style={styles.buttonText}>
          File Settlement Claim Form
        </ThemedText>
      </Pressable>

      <Pressable
        testID="button-save-track-claim"
        onPress={() => {
          console.log("[ClaimActionPanel] Save & Track button pressed");
          console.log("[ClaimActionPanel] Button disabled states:", { isTracking, isSaving });
          handleSaveTrack();
        }}
        disabled={isTracking || isSaving}
        style={({ pressed }) => [
          styles.button,
          isTracking ? styles.blueButtonDisabled : styles.blueButton,
          {
            opacity: pressed || isTracking ? 0.7 : 1,
          },
        ]}
      >
        <Feather
          name={isTracking ? "check" : "bookmark"}
          size={18}
          color="#FFFFFF"
        />
        <ThemedText type="body" style={styles.buttonText}>
          {isSaving
            ? "Saving..."
            : isTracking
              ? "You're Tracking This Settlement Claim"
              : "Save & Track Settlement Claim"}
        </ThemedText>
      </Pressable>

      <Pressable
        testID="button-visit-settlement-website"
        onPress={handleVisitWebsite}
        disabled={!canVisitWebsite}
        style={({ pressed }) => [
          styles.button,
          canVisitWebsite ? styles.blueButton : styles.disabledButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather
          name="external-link"
          size={18}
          color={canVisitWebsite ? "#FFFFFF" : "#6b7280"}
        />
        <ThemedText
          type="body"
          style={[
            styles.buttonText,
            { color: canVisitWebsite ? "#FFFFFF" : "#374151" },
          ]}
        >
          Visit Settlement Website
        </ThemedText>
      </Pressable>

      {hasClickedFileForm && !isTracking ? (
        <ThemedText
          type="small"
          style={{ color: theme.warning, textAlign: "center", marginTop: -Spacing.xs }}
        >
          Complete 'Save & Track' to unlock the settlement website link
        </ThemedText>
      ) : null}

      <Pressable
        testID="button-view-my-claims"
        onPress={handleViewClaims}
        style={({ pressed }) => [
          styles.button,
          styles.outlineButton,
          { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="eye" size={18} color={theme.text} />
        <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.sm }}>
          View My Settlement Claims
        </ThemedText>
      </Pressable>

      <Modal
        visible={showEligibilityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEligibilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Eligibility Check</ThemedText>
              <Pressable onPress={() => setShowEligibilityModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}
            >
              Answer a few questions to check your eligibility for this
              settlement.
            </ThemedText>

            {currentQuestion ? (
              <>
                <ThemedText
                  type="small"
                  style={{ color: theme.textTertiary, marginBottom: Spacing.md }}
                >
                  Question {currentQuestionIndex + 1} of {questions.length}
                </ThemedText>

                <ThemedText type="body" style={{ marginBottom: Spacing.lg, fontWeight: "600" }}>
                  {currentQuestion.questionText}
                </ThemedText>

                <View style={styles.answerButtons}>
                  {["yes", "no", "not_sure"].map((answer) => (
                    <Pressable
                      key={answer}
                      testID={`button-answer-${answer}`}
                      onPress={() =>
                        handleEligibilityAnswer(currentQuestion.id, answer)
                      }
                      style={[
                        styles.answerButton,
                        {
                          backgroundColor:
                            currentAnswer === answer
                              ? theme.primary
                              : theme.backgroundDefault,
                          borderColor:
                            currentAnswer === answer
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={{
                          color:
                            currentAnswer === answer ? "#FFFFFF" : theme.text,
                          fontWeight: "600",
                        }}
                      >
                        {answer === "yes"
                          ? "Yes"
                          : answer === "no"
                            ? "No"
                            : "I'm not sure"}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.modalFooter}>
              <Pressable
                testID="button-skip-eligibility"
                onPress={handleSkipEligibility}
                style={[styles.modalButton, { backgroundColor: theme.backgroundDefault }]}
              >
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Skip
                </ThemedText>
              </Pressable>
              <Pressable
                testID="button-next-question"
                onPress={handleEligibilityNext}
                disabled={!currentAnswer}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: currentAnswer
                      ? theme.primary
                      : theme.backgroundTertiary,
                    flex: 1,
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: currentAnswer ? "#FFFFFF" : theme.textTertiary,
                    fontWeight: "600",
                  }}
                >
                  {currentQuestionIndex === questions.length - 1
                    ? "Continue to Claim Form"
                    : "Next"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReminderModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.backgroundRoot },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Have you completed the claim form?</ThemedText>
              <Pressable onPress={() => setShowReminderModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}
            >
              We noticed you opened the claim form. Have you completed your
              submission?
            </ThemedText>

            <View
              style={[
                styles.confirmationBox,
                { backgroundColor: `${theme.warning}15`, borderColor: theme.warning },
              ]}
            >
              <View style={styles.confirmationHeader}>
                <Feather name="clipboard" size={20} color={theme.warning} />
                <ThemedText
                  type="body"
                  style={{ fontWeight: "600", marginLeft: Spacing.sm }}
                >
                  Claim Confirmation Number
                </ThemedText>
              </View>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
              >
                If you received a confirmation number, paste it below. Check
                your email if you've already closed the claim page.
              </ThemedText>
              <TextInput
                testID="input-confirmation-number"
                style={[
                  styles.confirmationInput,
                  {
                    backgroundColor: theme.backgroundRoot,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="e.g., CLM-2024-ABC123"
                placeholderTextColor={theme.textTertiary}
                value={claimConfirmationNumber}
                onChangeText={setClaimConfirmationNumber}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                testID="button-remind-me"
                onPress={() => setShowReminderModal(false)}
                style={[styles.modalButton, { backgroundColor: theme.backgroundDefault }]}
              >
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Remind Me Later
                </ThemedText>
              </Pressable>
              <Pressable
                testID="button-save-track-modal"
                onPress={handleReminderSave}
                style={[styles.modalButton, { backgroundColor: theme.primary, flex: 1 }]}
              >
                <ThemedText
                  type="body"
                  style={{ color: "#FFFFFF", fontWeight: "600" }}
                >
                  Save & Track Claim
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  unauthContent: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  loginButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  greenButton: {
    backgroundColor: "#22c55e",
  },
  blueButton: {
    backgroundColor: "#3b82f6",
  },
  blueButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  disabledButton: {
    backgroundColor: "#e5e7eb",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  answerButtons: {
    gap: Spacing.sm,
  },
  answerButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmationBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  confirmationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  confirmationInput: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
  },
});
