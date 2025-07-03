"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  Receipt,
  DollarSign,
} from "lucide-react";

export default function OrderSuccessModal({
  isOpen,
  onClose,
  orderData,
  orderId,
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isOpen && countdown === 0) {
      // Auto redirect after countdown
      handleViewOrder();
    }
  }, [isOpen, countdown]);

  const handleViewOrder = () => {
    onClose();
    router.push(`/thank-you?orderId=${orderId}`);
  };

  const handleContinueOrdering = () => {
    onClose();
    // Stay on current page
  };

  if (!orderData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        {/* Success Header with Animation */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full animate-pulse animation-delay-1000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full animate-pulse animation-delay-2000" />
          </div>

          <div className="relative">
            <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="h-6 w-6" />
                Đặt hàng thành công!
              </DialogTitle>
              <DialogDescription className="text-green-100 text-lg">
                Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ chuẩn bị ngay!
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                Chi tiết đơn hàng
              </h3>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700"
              >
                #{orderId}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {orderData.items.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.price.toLocaleString("vi-VN")}đ × {item.quantity}
                      </p>
                    </div>
                    <div className="font-semibold">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                  {index < orderData.items.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}

              <Separator className="my-4" />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-green-600 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {orderData.total_amount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-semibold">Thời gian giao hàng dự kiến</p>
                <p className="text-sm">12:00 - 13:00 hôm nay</p>
              </div>
            </div>
          </div>

          {/* Auto redirect countdown */}
          <div className="text-center text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
            <p>
              Tự động chuyển đến trang chi tiết trong{" "}
              <span className="font-mono font-bold text-green-600">
                {countdown}
              </span>{" "}
              giây
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleContinueOrdering}
              className="w-full"
            >
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Đặt thêm
            </Button>

            <Button
              onClick={handleViewOrder}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Xem chi tiết
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
