import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // For web platform, detect the current origin and use port 5000
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    // Always route to port 5000 for the backend API
    return `${protocol}//${hostname}:5000`;
  }
  
  // For native (iOS/Android), use the EXPO_PUBLIC_DOMAIN env var
  // EXPO_PUBLIC_DOMAIN is set to $REPLIT_DEV_DOMAIN:5000
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (host) {
    // Check if host already has a port (e.g., "domain:5000")
    if (host.includes(":")) {
      return `https://${host}`;
    }
    // Add port 5000 for backend
    return `https://${host}:5000`;
  }

  // Fallback for development
  return "http://localhost:5000";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
