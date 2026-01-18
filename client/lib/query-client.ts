import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  // Fallback for local development or when env var is not set
  if (!host) {
    // Check if we're on web and can detect the current origin
    if (typeof window !== "undefined" && window.location) {
      // Use port 5000 for the backend
      const { protocol, hostname } = window.location;
      return `${protocol}//${hostname}:5000`;
    }
    // For native, try localhost
    return "http://localhost:5000";
  }

  // Remove port if it's already included, we want to use port 5000
  const hostWithoutPort = host.replace(/:5000$/, "").replace(/:8081$/, "");
  
  // Use HTTPS for production domains
  const protocol = hostWithoutPort.includes("localhost") ? "http" : "https";
  
  // Always point to port 5000 for the backend
  const url = hostWithoutPort.includes("localhost") 
    ? `${protocol}://${hostWithoutPort}:5000`
    : `${protocol}://${hostWithoutPort}`;

  return url;
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
