"use client";

import { useEffect } from "react";
import { AlertTriangle, Shield, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DevToolsWarning({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      // Disable scrolling
      document.body.style.overflow = "hidden";

      // Prevent all keyboard interactions
      const handleKeydown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      // Prevent all mouse interactions except on modal
      const handleMouseEvent = (e) => {
        if (!e.target.closest(".warning-modal")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      document.addEventListener("keydown", handleKeydown, true);
      document.addEventListener("click", handleMouseEvent, true);
      document.addEventListener("mousedown", handleMouseEvent, true);
      document.addEventListener("mouseup", handleMouseEvent, true);
      document.addEventListener("mousemove", handleMouseEvent, true);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleKeydown, true);
        document.removeEventListener("click", handleMouseEvent, true);
        document.removeEventListener("mousedown", handleMouseEvent, true);
        document.removeEventListener("mouseup", handleMouseEvent, true);
        document.removeEventListener("mousemove", handleMouseEvent, true);

        // Force restore text selection and drag
        document.onselectstart = null;
        document.ondragstart = null;

        console.log("🔓 [SECURITY] Modal closed - All interactions restored");
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/30 rounded-full blur-xl animate-ping" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-orange-500/30 rounded-full blur-xl animate-ping animation-delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-yellow-500/30 rounded-full blur-xl animate-ping animation-delay-2000" />
      </div>

      {/* Modal */}
      <div className="warning-modal relative max-w-2xl mx-4 p-8 bg-white rounded-2xl shadow-2xl border-4 border-red-500">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-red-600 mb-2 animate-pulse">
            🚨 Ối giồi ôi! 🚨
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Phát hiện hành vi đáng ngờ!
          </p>
        </div>

        {/* Warning Content */}
        <div className="space-y-6 text-center">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Eye className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-700">
                Cảnh báo bảo mật!
              </h3>
            </div>
            <p className="text-red-600 font-medium">
              Hệ thống phát hiện bạn đang cố gắng truy cập Developer Tools hoặc
              thực hiện các hành động không được phép.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <Lock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-orange-700 font-medium">
                🔒 Nội dung được bảo vệ
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Shield className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-700 font-medium">
                🛡️ Chống sao chép
              </p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2">
              ⚠️ Hành động bị chặn:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mở Developer Tools (F12)</li>
              <li>• Inspect Element (Ctrl+Shift+I)</li>
              <li>• View Source (Ctrl+U)</li>
              <li>• Right-click menu</li>
              <li>• Text selection & copying</li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-gray-800">
              🍜 Vui lòng sử dụng ứng dụng một cách bình thường để đặt đồ ăn
              ngon! 🍜
            </p>

            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              ✅ Tôi hiểu rồi, về trang chủ thôi!
            </Button>
          </div>

          <div className="text-xs text-gray-500 border-t pt-4">
            <p>🔐 Hệ thống bảo mật TicketBox Food • Phiên bản 2.0</p>
            <p>Được thiết kế để bảo vệ quyền riêng tư và bản quyền</p>
          </div>
        </div>
      </div>

      {/* Floating warning indicators */}
      <div className="absolute top-4 left-4">
        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          🚫 CHẶN
        </div>
      </div>
      <div className="absolute top-4 right-4">
        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          ⚠️ CẢNH BÁO
        </div>
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          🛡️ BẢO VỆ
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          ✅ AN TOÀN
        </div>
      </div>
    </div>
  );
}
