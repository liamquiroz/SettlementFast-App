import React from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const { theme } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withSpring(
      selected ? theme.primary : theme.backgroundDefault,
      { damping: 15, stiffness: 150 }
    ),
    borderColor: withSpring(
      selected ? theme.primary : theme.border,
      { damping: 15, stiffness: 150 }
    ),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.chip, animatedStyle]}
    >
      <ThemedText
        type="small"
        style={[
          styles.label,
          { color: selected ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontWeight: "500",
  },
});
