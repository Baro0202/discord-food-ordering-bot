import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase-server";
import { EnhancedWebDatabase } from "../../../lib/enhancedDatabase";

export async function POST(request) {
  try {
    // TEMPORARY: Disable security checks for development
    console.log("🔓 [API-SECURITY] Security checks DISABLED for development");

    // Get request body
    const body = await request.json();
    const { userId, orderData } = body;

    if (!userId || !orderData) {
      return NextResponse.json(
        { error: "Missing required fields: userId, orderData" },
        { status: 400 }
      );
    }

    // Debug logging
    console.log("[API-DEBUG] Received order data:", {
      userId,
      orderData: {
        ...orderData,
        totalAmount: orderData.totalAmount,
        totalAmountType: typeof orderData.totalAmount,
        itemsCount: orderData.items?.length,
      },
    });

    // Validate order data
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain items" },
        { status: 400 }
      );
    }

    // Fix: Convert totalAmount to number and check for valid positive number
    const totalAmount = Number(orderData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        {
          error: `Invalid total amount: ${
            orderData.totalAmount
          } (${typeof orderData.totalAmount})`,
        },
        { status: 400 }
      );
    }

    // Update orderData with proper number
    orderData.totalAmount = totalAmount;

    // Use Enhanced Database with Kafka integration (server-side only)
    const db = new EnhancedWebDatabase();
    const result = await db.createWebOrder(userId, orderData);

    if (result.error) {
      console.error("[API] Error creating order:", result.error);
      return NextResponse.json(
        { error: result.error.message || "Failed to create order" },
        { status: 500 }
      );
    }

    console.log(
      "[API] Order created successfully with Kafka integration:",
      result.data.id
    );

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Order creation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // TEMPORARY: Disable security checks for development
    console.log(
      "🔓 [API-SECURITY] Security checks DISABLED for GET /api/orders"
    );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit")) || 10;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // Get user orders
    const db = new EnhancedWebDatabase();
    const result = await db.getUserOrders(userId, limit);

    if (result.error) {
      console.error("[API] Error fetching orders:", result.error);
      return NextResponse.json(
        { error: result.error.message || "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.data.length,
    });
  } catch (error) {
    console.error("[API] Get orders error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
