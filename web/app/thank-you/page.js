"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase";
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
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ShoppingCart,
  ArrowRight,
  Home,
  Receipt,
  Loader2,
  Sparkles,
  DollarSign,
  Calendar,
} from "lucide-react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!orderId) {
      router.push("/menu");
      return;
    }

    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setOrder(data);
    } catch (err) {
      setError("Không thể tải thông tin đơn hàng: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Đang tải thông tin đơn hàng...
            </h3>
            <p className="text-muted-foreground">Vui lòng chờ trong giây lát</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-muted-foreground mb-6">
              {error || "Đơn hàng không tồn tại hoặc đã bị xóa"}
            </p>
            <Button asChild className="w-full">
              <Link href="/menu">Về trang Menu</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header with Animation */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Đặt hàng thành công! 🎉
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cảm ơn bạn đã đặt hàng! Chúng tôi sẽ chuẩn bị đơn hàng và giao đến
            bạn sớm nhất có thể.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>
              Đặt lúc: {new Date(order.created_at).toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Dự kiến giao: 12:00 - 13:00</span>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-green-600" />
                <span>Chi tiết đơn hàng</span>
              </CardTitle>
              <CardDescription>
                Mã đơn hàng:{" "}
                <span className="font-mono font-semibold">#{order.id}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {order.items &&
                  order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.price.toLocaleString("vi-VN")}đ ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {(item.price * item.quantity).toLocaleString(
                              "vi-VN"
                            )}
                            đ
                          </div>
                        </div>
                      </div>
                      {index < order.items.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}

                <Separator className="my-6" />

                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-green-600 flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {order.total_amount?.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Trạng thái đơn hàng</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Đơn hàng đã được tiếp nhận</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Hoàn thành
                  </Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <UtensilsCrossed className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Đang chuẩn bị món ăn</p>
                    <p className="text-sm text-muted-foreground">
                      Dự kiến hoàn thành: 11:30
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    Đang xử lý
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Giao hàng</p>
                    <p className="text-sm text-muted-foreground">
                      12:00 - 13:00
                    </p>
                  </div>
                  <Badge variant="outline">Chưa bắt đầu</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hành động nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/orders">
                  <Receipt className="h-4 w-4 mr-2" />
                  Xem tất cả đơn hàng
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/menu">
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  Đặt món khác
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Về trang chủ
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">
                Cần hỗ trợ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-800">
                Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với
                chúng tôi.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  📞 Hotline: <span className="font-semibold">1900-1234</span>
                </p>
                <p className="text-sm text-blue-700">
                  ✉️ Email:{" "}
                  <span className="font-semibold">support@ticketbox.vn</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Shopping CTA */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-bold">Hài lòng với dịch vụ?</h3>
            <p className="text-green-100">
              Chia sẻ trải nghiệm của bạn với đồng nghiệp để cùng thưởng thức
              những bữa cơm ngon!
            </p>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="bg-white text-green-600 hover:bg-green-50"
            >
              <Link href="/menu">
                <UtensilsCrossed className="h-5 w-5 mr-2" />
                Đặt món cho ngày mai
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-96 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Đang tải trang...</h3>
              <p className="text-muted-foreground">
                Vui lòng chờ trong giây lát
              </p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
