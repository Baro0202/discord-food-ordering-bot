"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { createClient } from "../../lib/supabase";
import { secureApi } from "../../lib/secureApi";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Lock,
  Frown,
  CheckCircle,
  CreditCard,
  ArrowLeft,
  Store,
} from "lucide-react";
import OrderSuccessModal from "../components/OrderSuccessModal";

export default function MenuPage() {
  const { user, loading } = useAuth();
  const [menu, setMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchTodayMenu();
  }, []);

  const fetchTodayMenu = async () => {
    try {
      setIsLoading(true);

      // Get today's menu
      const { data: menuData, error: menuError } = await supabase
        .from("daily_menus")
        .select("*")
        .eq("menu_date", today)
        .single();

      if (menuError && menuError.code !== "PGRST116") {
        throw menuError;
      }

      setMenu(menuData);

      if (menuData && menuData.menu_items) {
        // Get menu items details
        const { data: itemsData, error: itemsError } = await supabase
          .from("menu_items")
          .select("*")
          .in("id", menuData.menu_items)
          .eq("available", true);

        if (itemsError) throw itemsError;

        // Debug: Check if items have valid prices
        if (itemsData) {
          console.log(
            "[DEBUG] Menu items loaded:",
            itemsData.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              priceType: typeof item.price,
            }))
          );

          // Filter out items without valid prices
          const validItems = itemsData.filter(
            (item) => item.price && Number(item.price) > 0
          );

          if (validItems.length !== itemsData.length) {
            console.warn(
              "[DEBUG] Some items have invalid prices, filtered out:",
              itemsData.length - validItems.length
            );
          }

          setMenuItems(validItems);
        } else {
          setMenuItems([]);
        }
      }
    } catch (err) {
      setError("Không thể tải menu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item) => {
    console.log("[DEBUG] Adding item to cart:", {
      id: item.id,
      name: item.name,
      price: item.price,
      priceType: typeof item.price,
    });

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalAmount = () => {
    const total = cart.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const itemTotal = price * quantity;
      console.log(
        `[DEBUG] Item ${item.name}: price=${price}, quantity=${quantity}, itemTotal=${itemTotal}`
      );
      return total + itemTotal;
    }, 0);
    console.log(`[DEBUG] Total amount calculated: ${total}`);
    return total;
  };

  const handleCheckout = async () => {
    if (!user) {
      setError("Vui lòng đăng nhập để đặt hàng");
      return;
    }

    if (cart.length === 0) {
      setError("Vui lòng chọn món ăn");
      return;
    }

    // Validate cart items have valid prices
    const invalidItems = cart.filter(
      (item) =>
        !item.price ||
        Number(item.price) <= 0 ||
        !item.quantity ||
        Number(item.quantity) <= 0
    );

    if (invalidItems.length > 0) {
      console.error("[DEBUG] Invalid cart items:", invalidItems);
      setError("Có món ăn không hợp lệ trong giỏ hàng. Vui lòng thử lại.");
      return;
    }

    setIsCheckingOut(true);
    setError("");

    try {
      const totalAmount = getTotalAmount();

      // Validate total amount
      if (!totalAmount || totalAmount <= 0) {
        console.error("[DEBUG] Invalid total amount:", totalAmount);
        setError("Tổng tiền không hợp lệ. Vui lòng kiểm tra lại giỏ hàng.");
        setIsCheckingOut(false);
        return;
      }

      const orderData = {
        username: user.email,
        menuDate: today,
        items: cart,
        totalAmount: totalAmount,
        notes: null,
      };

      // Debug logging
      console.log("[DEBUG] Order data:", {
        totalAmount,
        cartLength: cart.length,
        cart: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          itemTotal: item.price * item.quantity,
        })),
      });

      // Call secure API route for order creation (with Kafka integration on server-side)
      const response = await secureApi.post("/api/orders", {
        userId: user.id,
        orderData: orderData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create order");
      }

      const data = result.data;

      // Set order success data and show modal
      setOrderSuccess({
        orderId: data.id,
        orderData: {
          ...orderData,
          id: data.id,
          total_amount: orderData.totalAmount,
        },
      });
      setShowSuccessModal(true);
      setCart([]);

      console.log(
        "[WEB] Order created successfully with Kafka integration:",
        result.data.id
      );
    } catch (err) {
      setError("Không thể đặt hàng: " + err.message);
      console.error("[ERROR] Checkout failed:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center space-y-4">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-primary animate-pulse" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Đang tải menu...</p>
              <p className="text-muted-foreground">
                Vui lòng chờ trong giây lát
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Vui lòng đăng nhập</CardTitle>
            <CardDescription>
              Bạn cần đăng nhập để xem menu và đặt hàng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/login">Đăng nhập ngay</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No menu available state
  if (!menu) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Frown className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Chưa có menu hôm nay</CardTitle>
            <CardDescription>
              Menu hôm nay chưa được cập nhật. Vui lòng quay lại sau.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard">Về Dashboard</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về trang chủ
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            Menu Hôm Nay
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <p className="text-lg">
              {new Date(today).toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {menu.special_note && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-blue-800 font-medium">{menu.special_note}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Menu Items */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Store className="h-6 w-6" />
                Món ăn hôm nay
              </h2>
              <Badge variant="secondary" className="text-sm">
                {menuItems.length} món
              </Badge>
            </div>

            {menuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <Card
                    key={item.id}
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {item.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg leading-tight">
                        {item.name}
                      </CardTitle>
                      {item.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {item.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-600">
                          {item.price.toLocaleString("vi-VN")}đ
                        </div>
                        <Button
                          onClick={() => addToCart(item)}
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Thêm
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Chưa có món ăn</h3>
                      <p className="text-muted-foreground">
                        Chưa có món ăn nào trong menu hôm nay
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Giỏ hàng
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {item.name}
                            </h4>
                            <p className="text-sm text-green-600 font-medium">
                              {item.price.toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-destructive hover:text-destructive ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-medium">
                            {(item.price * item.quantity).toLocaleString(
                              "vi-VN"
                            )}
                            đ
                          </div>
                        </div>

                        {/* Separator except for last item */}
                        {cart.indexOf(item) < cart.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="space-y-4">
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-green-600">
                        {getTotalAmount().toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isCheckingOut ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Đặt hàng
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Giỏ hàng trống</h3>
                      <p className="text-sm text-muted-foreground">
                        Thêm món ăn để bắt đầu đặt hàng
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      {orderSuccess && (
        <OrderSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setOrderSuccess(null);
          }}
          orderData={orderSuccess.orderData}
          orderId={orderSuccess.orderId}
        />
      )}
    </div>
  );
}
