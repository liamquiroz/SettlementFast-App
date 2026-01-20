import { supabase } from "./supabase";
import { Platform } from "react-native";

import { getApiUrl } from "./query-client";

// Use local proxy in development to bypass CORS, direct API in production
const API_BASE_URL = getApiUrl();

// Debug logging for native platforms
if (Platform.OS !== "web") {
  console.log("[API] Platform:", Platform.OS);
  console.log("[API] EXPO_PUBLIC_DOMAIN:", process.env.EXPO_PUBLIC_DOMAIN);
  console.log("[API] API_BASE_URL:", API_BASE_URL);
}

// Endpoints that require authentication (user-specific data)
const AUTH_REQUIRED_ENDPOINTS = [
  "/api/user-settlements",
  "/api/user/profile",
  "/api/email-preferences",
  "/api/dashboard/stats",
];

function requiresAuth(endpoint: string): boolean {
  return AUTH_REQUIRED_ENDPOINTS.some(authEndpoint => 
    endpoint.startsWith(authEndpoint)
  );
}

async function getAuthHeaders(endpoint: string): Promise<Record<string, string>> {
  // Only add auth headers for endpoints that require authentication
  if (!requiresAuth(endpoint)) {
    return {
      "Content-Type": "application/json",
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }
  return {
    "Content-Type": "application/json",
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders(endpoint);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export interface Settlement {
  id: string;
  title: string;
  slug: string;
  category: string;
  brands: string[];
  country: string;
  shortDescription: string;
  fullDescription?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  claimDeadline?: string;
  payoutMinEstimate?: string;
  payoutMaxEstimate?: string;
  proofRequired: boolean;
  claimWebsiteUrl?: string;
  claimFormUrl?: string;
  source?: string;
  sourceUrl?: string;
  logoUrl?: string;
  status: "OPEN" | "EXPIRING" | "CLOSED" | "PAYING" | "ARCHIVED";
  keyRequirements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  isLawyer: boolean;
  referralCode?: string;
  hasCompletedOnboarding: boolean;
  freeClaimsUsed: number;
  accountStatus: "active" | "suspended" | "banned";
}

export interface UserSettlement {
  id: string;
  userId: string;
  settlementId: string;
  eligibilityResult?: "LIKELY" | "POSSIBLE" | "UNLIKELY";
  eligibilityAnswers?: Record<string, unknown>;
  status: "NOT_FILED" | "FILED_PENDING" | "PAID" | "REJECTED" | "UNKNOWN";
  claimConfirmationNumber?: string;
  filedAt?: string;
  payoutAmount?: string;
  payoutReceivedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  settlement?: Settlement;
}

export interface DashboardStats {
  totalClaims: number;
  activeClaims: number;
  totalEstimatedPayout: number;
  totalReceived: number;
  upcomingDeadlines: number;
}

export interface EligibilityQuestion {
  id: string;
  settlementId: string;
  questionText: string;
  questionType: "YES_NO" | "MULTIPLE_CHOICE";
  options: string[];
  weight: number;
  orderIndex: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  preferredCategories: string[];
  preferredBrands: string[];
  emailDeadlineReminders: boolean;
  emailNewSettlements: boolean;
  emailClaimUpdates: boolean;
  emailWeeklyDigest: boolean;
}

export const settlementsApi = {
  list: (params?: {
    search?: string;
    category?: string;
    status?: string;
    minPayout?: number;
    maxPayout?: number;
    proofRequired?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.minPayout) searchParams.set("minPayout", params.minPayout.toString());
    if (params?.maxPayout) searchParams.set("maxPayout", params.maxPayout.toString());
    if (params?.proofRequired !== undefined) searchParams.set("proofRequired", params.proofRequired.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    const query = searchParams.toString();
    return api.get<Settlement[]>(`/api/settlements${query ? `?${query}` : ""}`);
  },
  getBySlug: (slug: string) => api.get<Settlement>(`/api/settlements/${slug}`),
  getQuestions: (slug: string) => api.get<EligibilityQuestion[]>(`/api/settlements/${slug}/questions`),
  getRecommended: () => api.get<Settlement[]>("/api/settlements/recommended"),
  getUpcomingDeadlines: (days?: number) => 
    api.get<Settlement[]>(`/api/settlements/upcoming-deadlines${days ? `?days=${days}` : ""}`),
};

export const userSettlementsApi = {
  list: () => api.get<UserSettlement[]>("/api/user-settlements"),
  getStats: () => api.get<DashboardStats>("/api/user-settlements/stats"),
  getBySettlement: (settlementId: string) => 
    api.get<UserSettlement>(`/api/user-settlements/by-settlement/${settlementId}`),
  create: (data: { settlementId: string; eligibilityResult?: string; eligibilityAnswers?: Record<string, unknown> }) =>
    api.post<UserSettlement>("/api/user-settlements", data),
  update: (id: string, data: Partial<UserSettlement>) =>
    api.patch<UserSettlement>(`/api/user-settlements/${id}`, data),
  delete: (id: string) => api.delete(`/api/user-settlements/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/api/dashboard/stats"),
};

export const userApi = {
  getProfile: () => api.get<UserProfile>("/api/user/profile"),
  updateProfile: (data: Partial<UserProfile>) => api.patch<UserProfile>("/api/user/profile", data),
  getEmailPreferences: () => api.get<UserProfile>("/api/email-preferences"),
  updateEmailPreferences: (data: Partial<UserProfile>) => api.patch<UserProfile>("/api/email-preferences", data),
};

export interface CategoryWithCount {
  name: string;
  count: number;
}

export const exploreApi = {
  getBrands: () => api.get<string[]>("/api/explore/brands"),
  getCategories: () => api.get<CategoryWithCount[]>("/api/explore/categories"),
};
