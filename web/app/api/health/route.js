import { EnhancedWebDatabase } from "../../../lib/enhancedDatabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simplified health check without headers for static compatibility

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
