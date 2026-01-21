import React from "react";
import { StyleSheet, View, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface LogoContainerProps {
  logoUrl?: string | null;
  size?: "small" | "medium" | "large";
  fallbackIcon?: keyof typeof Feather.glyphMap;
}

const SIZES = {
  small: 40,
  medium: 52,
  large: 72,
};

const ICON_SIZES = {
  small: 18,
  medium: 22,
  large: 32,
};

export function LogoContainer({ 
  logoUrl, 
  size = "medium",
  fallbackIcon = "file-text"
}: LogoContainerProps) {
  const { theme, isDark } = useTheme();
  const containerSize = SIZES[size];
  const iconSize = ICON_SIZES[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: "#FFFFFF",
          borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={[
            styles.logo,
            {
              width: containerSize - 8,
              height: containerSize - 8,
            },
          ]}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: theme.primary }]}>
          <Feather name={fallbackIcon} size={iconSize} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    borderRadius: BorderRadius.sm,
  },
  fallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
