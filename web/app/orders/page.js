"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { createClient } from "../../lib/supabase";
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
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Calendar,
  Clock,
  CreditCard,
  ChefHat,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  FileText,
  Package,
  AlertCircle,
  CheckCircle2,
  Timer,
  X,
  Receipt,
  Utensils,
} from "lucide-react";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("order_source", "web")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      setError("Không thể tải đơn hàng: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          JSON.stringify(order.items)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "pending":
        return <Timer className="h-4 w-4" />;
      case "preparing":
        return <ChefHat className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "preparing":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "pending":
        return "Chờ xử lý";
      case "preparing":
        return "Đang chuẩn bị";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getPaymentStatusVariant = (status) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "pending":
        return "Chờ thanh toán";
      case "failed":
        return "Thanh toán thất bại";
      default:
        return status;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Loading Header */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          {/* Loading Cards */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="flex space-x-2">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle className="text-2xl font-bold mb-4">
              Vui lòng đăng nhập
            </CardTitle>
            <CardDescription className="text-base mb-6">
              Bạn cần đăng nhập để xem lịch sử đơn hàng của mình
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <CreditCard className="mr-2 h-4 w-4" />
                Đăng nhập ngay
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <Receipt className="mr-3 h-8 w-8 text-purple-600" />
                Đơn hàng của tôi
              </h1>
              <p className="text-gray-600 text-lg">
                Theo dõi lịch sử và trạng thái đơn hàng của bạn
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Link href="/menu">
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Đặt món mới
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo mã đơn hàng hoặc món ăn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  Tất cả
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => setStatusFilter("pending")}
                  size="sm"
                >
                  Chờ xử lý
                </Button>
                <Button
                  variant={statusFilter === "preparing" ? "default" : "outline"}
                  onClick={() => setStatusFilter("preparing")}
                  size="sm"
                >
                  Đang chuẩn bị
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  size="sm"
                >
                  Hoàn thành
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {currentOrders.length > 0 ? (
          <>
            <div className="space-y-6 mb-8">
              {currentOrders.map((order) => (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md"
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            Đơn hàng #{order.id}
                          </CardTitle>
                          <Badge
                            variant={getStatusVariant(order.status)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.created_at).toLocaleDateString(
                              "vi-VN",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(order.created_at).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {parseFloat(order.total_amount || 0).toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </div>
                        <Badge
                          variant={getPaymentStatusVariant(
                            order.payment_status
                          )}
                          className="flex items-center gap-1"
                        >
                          <CreditCard className="h-3 w-3" />
                          {getPaymentStatusText(order.payment_status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Separator className="mb-4" />

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Utensils className="h-4 w-4 mr-2 text-gray-600" />
                        Món đã đặt
                      </h4>
                      <div className="space-y-2">
                        {Array.isArray(order.items) ? (
                          order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-orange-600" />
                                </div>
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {item.quantity}x
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.price?.toLocaleString("vi-VN")}₫
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-600 bg-gray-50 rounded-lg p-3">
                            {JSON.stringify(order.items)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <>
                        <Separator className="mb-4" />
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-600" />
                            Ghi chú
                          </h4>
                          <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                            {order.notes}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Menu Date */}
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Menu ngày:{" "}
                          {new Date(order.menu_date).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span>Mã đơn: #{order.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Hiển thị {startIndex + 1}-
                      {Math.min(endIndex, filteredOrders.length)} trong tổng số{" "}
                      {filteredOrders.length} đơn hàng
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Trước
                      </Button>

                      <div className="flex gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>
              <CardTitle className="text-2xl font-bold mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Không tìm thấy đơn hàng"
                  : "Chưa có đơn hàng nào"}
              </CardTitle>
              <CardDescription className="text-base mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Bạn chưa đặt đơn hàng nào. Hãy xem menu hôm nay và đặt món yêu thích!"}
              </CardDescription>
              <div className="flex gap-3 justify-center">
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                )}
                <Button
                  asChild
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Link href="/menu">
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Xem Menu hôm nay
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
