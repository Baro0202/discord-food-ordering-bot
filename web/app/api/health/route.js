import { EnhancedWebDatabase } from "../../../lib/enhancedDatabase";
import { NextResponse } from "next/server";

// Force dynamic rendering since we use request.headers
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Health endpoint might be called by monitoring tools, so make security optional
    const securityCheck = request.headers.get("X-Security-Check");
    const clientType = request.headers.get("X-Client-Type");

    // If security headers are present, validate them
    if (securityCheck || clientType) {
      if (!securityCheck || securityCheck !== "passed") {
        console.error(
          "[API-SECURITY] Invalid security check header on health endpoint"
        );
        return NextResponse.json(
          { error: "Yêu cầu không hợp lệ." },
          { status: 403 }
        );
      }

      if (!clientType || clientType !== "web-app") {
        console.error("[API-SECURITY] Invalid client type on health endpoint");
        return NextResponse.json(
          { error: "Loại client không hợp lệ." },
          { status: 403 }
        );
      }

      console.log(
        "✅ [API-SECURITY] Security checks passed for GET /api/health"
      );
    }

    const db = new EnhancedWebDatabase();
    const healthStatus = await db.getHealthStatus();

    const response = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      application: "web-food-app",
      version: process.env.npm_package_version || "1.0.0",
      ...healthStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[HEALTH] Health check failed:", error);

    return NextResponse.json(
      {
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: error.message,
        application: "web-food-app",
      },
      { status: 500 }
    );
  }
}
