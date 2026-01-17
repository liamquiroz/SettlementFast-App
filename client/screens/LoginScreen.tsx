import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

type AuthMode = "login" | "signup" | "magic-link";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { signIn, signUp, signInWithMagicLink } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (mode !== "magic-link" && !password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let result;
      if (mode === "magic-link") {
        result = await signInWithMagicLink(email);
        if (!result.error) {
          setMagicLinkSent(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (mode === "signup") {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result?.error) {
        setError(result.error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing["4xl"] }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.success}15` }]}>
            <Feather name="mail" size={48} color={theme.success} />
          </View>
          <ThemedText type="h2" style={styles.title}>
            Check Your Email
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            We've sent a magic link to {email}. Click the link to sign in.
          </ThemedText>
          <Button onPress={() => setMagicLinkSent(false)} style={styles.button}>
            Back to Login
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"] }]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h1" style={[styles.title, { color: theme.primary }]}>
            SettlementFast
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Discover class action settlements you may qualify for
          </ThemedText>

          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <Feather name="mail" size={18} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={theme.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {mode !== "magic-link" ? (
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                ]}
              >
                <Feather name="lock" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${theme.error}15` }]}>
                <Feather name="alert-circle" size={16} color={theme.error} />
                <ThemedText type="small" style={{ color: theme.error, marginLeft: Spacing.sm, flex: 1 }}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <Button onPress={handleSubmit} disabled={isLoading} style={styles.button}>
              {isLoading
                ? "Please wait..."
                : mode === "magic-link"
                ? "Send Magic Link"
                : mode === "signup"
                ? "Create Account"
                : "Sign In"}
            </Button>

            <Pressable
              onPress={() => setMode(mode === "magic-link" ? "login" : "magic-link")}
              style={styles.switchMode}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                {mode === "magic-link" ? "Sign in with password" : "Sign in with magic link"}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}
            </ThemedText>
            <Pressable
              onPress={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                {" "}{mode === "signup" ? "Sign In" : "Sign Up"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.xl,
    borderRadius: 16,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["3xl"],
    maxWidth: 280,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
  },
  switchMode: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: Spacing["3xl"],
  },
});
