import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { supabaseAdmin, getUserFromToken, getAppUserIdFromSupabaseId } from "./supabase";

const PRODUCTION_API_URL = "https://settlementfast.com";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Local endpoint: Get user settlements (claims)
  app.get("/api/user-settlements", async (req: Request, res: Response) => {
    try {
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const appUserId = await getAppUserIdFromSupabaseId(authUser.id);
      
      if (!appUserId) {
        console.log("[API] No app user found, returning empty claims list");
        return res.json([]);
      }

      console.log(`[API] Fetching user settlements for app user: ${appUserId}`);

      const { data: userSettlements, error } = await supabaseAdmin
        .from("user_settlements")
        .select(`
          *,
          settlement:settlements(*)
        `)
        .eq("userId", appUserId)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("[API] Error fetching user settlements:", error);
        return res.status(500).json({ error: "Failed to fetch claims" });
      }

      console.log(`[API] Found ${userSettlements?.length || 0} claims`);
      return res.json(userSettlements || []);
    } catch (error) {
      console.error("[API] Error in GET /api/user-settlements:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Local endpoint: Get user settlements stats
  app.get("/api/user-settlements/stats", async (req: Request, res: Response) => {
    try {
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const appUserId = await getAppUserIdFromSupabaseId(authUser.id);
      
      if (!appUserId) {
        return res.json({
          totalClaims: 0,
          activeClaims: 0,
          totalEstimatedPayout: 0,
          totalReceived: 0,
          upcomingDeadlines: 0,
        });
      }

      const { data: userSettlements, error } = await supabaseAdmin
        .from("user_settlements")
        .select(`
          *,
          settlement:settlements(payoutMinEstimate, payoutMaxEstimate, claimDeadline)
        `)
        .eq("userId", appUserId);

      if (error) {
        console.error("[API] Error fetching stats:", error);
        return res.status(500).json({ error: "Failed to fetch stats" });
      }

      const settlements = userSettlements || [];
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const stats = {
        totalClaims: settlements.length,
        activeClaims: settlements.filter(s => 
          s.status === "NOT_FILED" || s.status === "FILED_PENDING"
        ).length,
        totalEstimatedPayout: settlements.reduce((sum, s) => {
          const min = parseFloat(s.settlement?.payoutMinEstimate) || 0;
          const max = parseFloat(s.settlement?.payoutMaxEstimate) || 0;
          return sum + ((min + max) / 2);
        }, 0),
        totalReceived: settlements
          .filter(s => s.status === "PAID")
          .reduce((sum, s) => sum + (parseFloat(s.payoutAmount) || 0), 0),
        upcomingDeadlines: settlements.filter(s => {
          const deadline = s.settlement?.claimDeadline ? new Date(s.settlement.claimDeadline) : null;
          return deadline && deadline > now && deadline <= sevenDaysFromNow;
        }).length,
      };

      return res.json(stats);
    } catch (error) {
      console.error("[API] Error in GET /api/user-settlements/stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Local endpoint: Get user settlement by settlement ID
  app.get("/api/user-settlements/by-settlement/:settlementId", async (req: Request, res: Response) => {
    try {
      const { settlementId } = req.params;
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const appUserId = await getAppUserIdFromSupabaseId(authUser.id);
      
      if (!appUserId) {
        return res.status(404).json({ error: "Not found" });
      }

      console.log(`[API] Getting user settlement for app user ${appUserId}, settlement ${settlementId}`);

      const { data, error } = await supabaseAdmin
        .from("user_settlements")
        .select(`
          *,
          settlement:settlements(*)
        `)
        .eq("userId", appUserId)
        .eq("settlementId", settlementId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Not found" });
      }

      return res.json(data);
    } catch (error) {
      console.error("[API] Error in GET /api/user-settlements/by-settlement:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Local endpoint: Create user settlement (save/track)
  app.post("/api/user-settlements", async (req: Request, res: Response) => {
    try {
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        console.log("[API] POST /api/user-settlements - No auth token");
        return res.status(401).json({ error: "Unauthorized" });
      }

      let appUserId = await getAppUserIdFromSupabaseId(authUser.id);
      
      // If no app user exists, create one with only essential fields
      if (!appUserId) {
        console.log("[API] Creating new app user for supabase user:", authUser.id);
        
        const { data: newUser, error: createError } = await supabaseAdmin
          .from("users")
          .insert({
            email: authUser.email || "",
            supabaseUserId: authUser.id,
          })
          .select()
          .single();

        if (createError || !newUser) {
          console.error("[API] Failed to create app user:", createError);
          return res.status(500).json({ error: "Failed to create user" });
        }

        appUserId = newUser.id;
        console.log("[API] Created new app user:", appUserId);
      }

      const { settlementId, eligibilityResult, eligibilityAnswers } = req.body;
      
      if (!settlementId) {
        return res.status(400).json({ error: "settlementId is required" });
      }

      console.log(`[API] Creating user settlement for user ${appUserId}, settlement ${settlementId}`);

      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from("user_settlements")
        .select("id")
        .eq("userId", appUserId)
        .eq("settlementId", settlementId)
        .single();

      if (existing) {
        console.log("[API] User settlement already exists:", existing.id);
        // Fetch the full record with settlement details
        const { data: fullRecord } = await supabaseAdmin
          .from("user_settlements")
          .select(`
            *,
            settlement:settlements(*)
          `)
          .eq("id", existing.id)
          .single();
        return res.json(fullRecord);
      }

      // Create new user settlement
      const { data: newUserSettlement, error } = await supabaseAdmin
        .from("user_settlements")
        .insert({
          userId: appUserId,
          settlementId,
          eligibilityResult: eligibilityResult || null,
          eligibilityAnswers: eligibilityAnswers || null,
          status: "NOT_FILED",
        })
        .select(`
          *,
          settlement:settlements(*)
        `)
        .single();

      if (error) {
        console.error("[API] Error creating user settlement:", error);
        return res.status(500).json({ error: "Failed to save claim" });
      }

      console.log("[API] Created user settlement:", newUserSettlement.id);
      return res.status(201).json(newUserSettlement);
    } catch (error) {
      console.error("[API] Error in POST /api/user-settlements:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Local endpoint: Update user settlement
  app.patch("/api/user-settlements/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const appUserId = await getAppUserIdFromSupabaseId(authUser.id);
      
      if (!appUserId) {
        return res.status(404).json({ error: "Not found" });
      }

      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from("user_settlements")
        .select("id")
        .eq("id", id)
        .eq("userId", appUserId)
        .single();

      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }

      const updateData = { ...req.body, updatedAt: new Date().toISOString() };
      delete updateData.id;
      delete updateData.userId;
      delete updateData.settlementId;
      delete updateData.createdAt;

      const { data: updated, error } = await supabaseAdmin
        .from("user_settlements")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          settlement:settlements(*)
        `)
        .single();

      if (error) {
        console.error("[API] Error updating user settlement:", error);
        return res.status(500).json({ error: "Failed to update claim" });
      }

      return res.json(updated);
    } catch (error) {
      console.error("[API] Error in PATCH /api/user-settlements:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Local endpoint: Delete user settlement
  app.delete("/api/user-settlements/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const appUserId = await getAppUserIdFromSupabaseId(authUser.id);
      
      if (!appUserId) {
        return res.status(404).json({ error: "Not found" });
      }

      const { error } = await supabaseAdmin
        .from("user_settlements")
        .delete()
        .eq("id", id)
        .eq("userId", appUserId);

      if (error) {
        console.error("[API] Error deleting user settlement:", error);
        return res.status(500).json({ error: "Failed to delete claim" });
      }

      return res.status(204).end();
    } catch (error) {
      console.error("[API] Error in DELETE /api/user-settlements:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Local endpoint: Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      const authUser = await getUserFromToken(req.headers.authorization);
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("supabaseUserId", authUser.id)
        .single();

      if (error || !user) {
        // Return minimal user info if app user doesn't exist yet
        return res.json({
          id: authUser.id,
          email: authUser.email || "",
          firstName: null,
          lastName: null,
          isAdmin: false,
          isLawyer: false,
          hasCompletedOnboarding: false,
          freeClaimsUsed: 0,
          accountStatus: "active",
        });
      }

      return res.json(user);
    } catch (error) {
      console.error("[API] Error in GET /api/auth/user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Proxy all other /api/* requests to the production SettlementFast API
  app.use("/api", async (req: Request, res: Response) => {
    try {
      const targetUrl = `${PRODUCTION_API_URL}${req.originalUrl}`;
      
      console.log(`${req.method} ${req.originalUrl} - proxying to ${targetUrl}`);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Forward authorization header if present
      const authHeader = req.headers.authorization;
      if (authHeader) {
        headers["Authorization"] = authHeader;
        console.log(`  Auth header present: ${authHeader.substring(0, 27)}...`);
      } else {
        console.log(`  No auth header present`);
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      // Include body for POST, PUT, PATCH requests
      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
        console.log(`  Request body:`, req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      
      console.log(`  Response status: ${response.status}`);
      
      // Forward status code
      res.status(response.status);
      
      // Forward content-type header
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      // Handle empty responses
      if (response.status === 204) {
        return res.end();
      }

      const data = await response.text();
      
      // Log response for debugging (truncate if too long)
      const logData = data.length > 200 ? data.substring(0, 200) + "..." : data;
      console.log(`  Response body: ${logData}`);
      
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(data);
        return res.json(jsonData);
      } catch {
        // If not JSON, send as-is
        return res.send(data);
      }
    } catch (error) {
      console.error("API Proxy Error:", error);
      res.status(502).json({ error: "Failed to proxy request to production API" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
