import React, { ReactNode, useState, useEffect } from "react";
import Constants from "expo-constants";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

interface StripeWrapperProps {
  children: ReactNode;
}

const isExpoGo = Constants.appOwnership === "expo";

export function StripeWrapper({ children }: StripeWrapperProps): JSX.Element {
  const [StripeProvider, setStripeProvider] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (!isExpoGo) {
      import("@stripe/stripe-react-native")
        .then((module) => {
          setStripeProvider(() => module.StripeProvider);
        })
        .catch((error) => {
          console.warn("Stripe not available:", error.message);
        });
    }
  }, []);

  if (isExpoGo || !StripeProvider) {
    return <>{children}</>;
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <>{children}</>
    </StripeProvider>
  );
}
