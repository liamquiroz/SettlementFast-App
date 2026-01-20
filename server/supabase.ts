import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://misxfwpxaukxdklqcxfq.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceRoleKey) {
  console.warn("[Supabase] Warning: SUPABASE_SERVICE_ROLE_KEY not set - database operations will fail");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthUser {
  id: string;
  email: string | undefined;
}

export async function getUserFromToken(authHeader: string | undefined): Promise<AuthUser | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.log("[Supabase] Failed to get user from token:", error?.message);
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    console.error("[Supabase] Error verifying token:", error);
    return null;
  }
}

export async function getAppUserIdFromSupabaseId(supabaseUserId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("supabase_user_id", supabaseUserId)
      .single();

    if (error || !data) {
      console.log("[Supabase] No app user found for supabase user:", supabaseUserId);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("[Supabase] Error getting app user:", error);
    return null;
  }
}
