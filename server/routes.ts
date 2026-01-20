import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

const PRODUCTION_API_URL = "https://settlementfast.com";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy all /api/* requests to the production SettlementFast API
  app.use("/api", async (req: Request, res: Response) => {
    try {
      const targetUrl = `${PRODUCTION_API_URL}${req.originalUrl}`;
      
      // Log incoming request
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
