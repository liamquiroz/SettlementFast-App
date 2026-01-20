import { ReactNode } from "react";

interface StripeWrapperProps {
  children: ReactNode;
}

export function StripeWrapper({ children }: StripeWrapperProps): JSX.Element {
  return <>{children}</>;
}
