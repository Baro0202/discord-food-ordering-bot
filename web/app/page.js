"use client";

import Link from "next/link";
import { useAuth } from "./providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Clock,
  Star,
  CheckCircle,
  Zap,
  CreditCard,
  UserPlus,
  Menu as MenuIcon,
  ShoppingCart,
  Timer,
  Sparkles,
  TrendingUp,
  Heart,
  Award,
} from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();

  const features = [
    {
      icon: UtensilsCrossed,
      title: "Menu đa dạng",
      description:
        "Menu được cập nhật hàng ngày với nhiều lựa chọn phong phú, đa dạng về khẩu vị từ các nhà hàng uy tín",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Zap,
      title: "Đặt hàng nhanh",
      description:
        "Giao diện đơn giản, trực quan. Đặt hàng chỉ trong vài click với trải nghiệm mượt mà và tiện lợi",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CreditCard,
      title: "Thanh toán tiện lợi",
      description:
        "Nhiều phương thức thanh toán linh hoạt, theo dõi đơn hàng realtime với thông báo tức thì",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: "Đăng ký tài khoản",
      description: "Tạo tài khoản nhanh chóng để bắt đầu sử dụng dịch vụ",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    {
      number: 2,
      icon: MenuIcon,
      title: "Xem menu hàng ngày",
      description:
        "Duyệt menu được cập nhật mỗi ngày với món ăn mới và hấp dẫn",
      color: "bg-gradient-to-br from-blue-500 to-indigo-500",
    },
    {
      number: 3,
      icon: ShoppingCart,
      title: "Đặt món yêu thích",
      description:
        "Chọn món và số lượng phù hợp với nhu cầu và sở thích của bạn",
      color: "bg-gradient-to-br from-green-500 to-teal-500",
    },
    {
      number: 4,
      icon: Timer,
      title: "Nhận cơm đúng giờ",
      description: "Thưởng thức bữa cơm được giao đúng thời gian cam kết",
      color: "bg-gradient-to-br from-orange-500 to-red-500",
    },
  ];

  const stats = [
    {
      value: "1,000+",
      label: "Đơn hàng đã giao",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      value: "50+",
      label: "Món ăn đa dạng",
      icon: UtensilsCrossed,
      color: "text-orange-600",
    },
    {
      value: "99%",
      label: "Khách hàng hài lòng",
      icon: Heart,
      color: "text-red-600",
    },
    {
      value: "24/7",
      label: "Hỗ trợ khách hàng",
      icon: Clock,
      color: "text-blue-600",
    },
  ];

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6">
      {/* Hero Section - Futuristic Design */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white overflow-hidden">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0">
          {/* Primary gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-purple-900/90" />

          {/* Animated geometric shapes */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-1000" />
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
          <div className="absolute bottom-32 right-1/4 w-72 h-72 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-3000" />

          {/* Tech grid pattern */}
          <div className="absolute inset-0 bg-grid-white-5 bg-[size:80px_80px] opacity-20" />

          {/* Floating tech elements */}
          <div className="absolute top-32 left-20 w-4 h-4 bg-cyan-400 rounded-full animate-ping opacity-40"></div>
          <div className="absolute top-64 right-32 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-60 animation-delay-1000"></div>
          <div className="absolute bottom-48 left-40 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-2000"></div>
          <div className="absolute top-48 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-70 animation-delay-3000"></div>
          <div className="absolute bottom-64 right-48 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping opacity-45 animation-delay-4000"></div>

          {/* Scan lines effect */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-1 animate-pulse"
            style={{ top: "20%" }}
          ></div>
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent h-1 animate-pulse animation-delay-1000"
            style={{ top: "60%" }}
          ></div>
        </div>

        <div className="relative container mx-auto px-4 py-24 lg:py-32 flex items-center min-h-screen z-10">
          <div className="text-center max-w-6xl mx-auto">
            <div className="space-y-12">
              <Badge
                variant="secondary"
                className="mb-8 text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-300 border border-cyan-400/30 backdrop-blur-sm px-6 py-3 hover:scale-105 transition-all duration-300"
              >
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                🎉 Hệ thống đặt cơm hàng ngày
              </Badge>

              {/* Futuristic Title with Advanced Effects */}
              <div className="relative">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-tight tracking-tight">
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                      Đặt cơm ngon
                    </span>
                    {/* Holographic effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 bg-clip-text text-transparent blur-sm">
                      Đặt cơm ngon
                    </span>
                  </span>
                  <br />
                  <span className="relative inline-block mt-4">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                      mỗi ngày
                    </span>
                    {/* Glowing underline */}
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 rounded-full opacity-70 animate-pulse"></div>
                  </span>
                </h1>

                {/* Floating tech elements around title */}
                <div className="absolute -top-8 -left-8 w-6 h-6 border-2 border-cyan-400 rounded rotate-45 animate-spin opacity-60"></div>
                <div className="absolute -top-4 -right-12 w-4 h-4 bg-purple-400 rounded-full animate-bounce opacity-50"></div>
                <div className="absolute -bottom-8 left-16 w-3 h-8 bg-gradient-to-t from-pink-400 to-transparent rounded-full animate-pulse opacity-70"></div>
                <div className="absolute -bottom-4 -right-8 w-8 h-3 bg-gradient-to-r from-orange-400 to-transparent rounded-full animate-pulse animation-delay-1000 opacity-60"></div>
              </div>

              <div className="max-w-4xl mx-auto space-y-6">
                <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-gray-200">
                  Giải pháp đặt cơm hiện đại cho team và công ty với giao diện
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-semibold mx-3">
                    thân thiện
                  </span>
                  và
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold mx-3">
                    dễ sử dụng
                  </span>
                </p>

                {/* Tech features highlight */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-300 border-emerald-400/30 px-4 py-2"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                    Cập nhật realtime
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-300 border-blue-400/30 px-4 py-2"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse animation-delay-500"></div>
                    Gợi ý thông minh
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-300 border-purple-400/30 px-4 py-2"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse animation-delay-1000"></div>
                    Đặt hàng nhanh
                  </Badge>
                </div>
              </div>

              {/* Futuristic Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center mt-12">
                {user ? (
                  <>
                    <Button
                      size="lg"
                      asChild
                      className="relative group text-xl px-12 py-8 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 shadow-2xl border-0 font-bold overflow-hidden transition-all duration-500 hover:scale-105"
                    >
                      <Link href="/menu">
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <UtensilsCrossed className="mr-3 h-6 w-6 relative z-10" />
                        <span className="relative z-10">Xem Menu hôm nay</span>
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      asChild
                      className="relative group text-xl px-12 py-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white hover:from-slate-700/50 hover:to-slate-600/50 border-2 border-cyan-400/30 hover:border-cyan-400/60 backdrop-blur-sm shadow-2xl font-bold transition-all duration-500 hover:scale-105"
                    >
                      <Link href="/orders">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <CheckCircle className="mr-3 h-6 w-6 relative z-10" />
                        <span className="relative z-10">Đơn hàng của tôi</span>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      asChild
                      className="relative group text-xl px-12 py-8 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 shadow-2xl border-0 font-bold overflow-hidden transition-all duration-500 hover:scale-105"
                    >
                      <Link href="/auth/signup">
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <UserPlus className="mr-3 h-6 w-6 relative z-10" />
                        <span className="relative z-10">Đăng ký ngay</span>
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      asChild
                      className="relative group text-xl px-12 py-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white hover:from-slate-700/50 hover:to-slate-600/50 border-2 border-cyan-400/30 hover:border-cyan-400/60 backdrop-blur-sm shadow-2xl font-bold transition-all duration-500 hover:scale-105"
                    >
                      <Link href="/auth/login">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10">Đăng nhập</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Futuristic Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20">
                    {/* Holographic border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-[1px] bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl"></div>

                    <div className="relative z-10">
                      {/* Animated icon */}
                      <div className="relative mb-4">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <stat.icon
                            className={`h-8 w-8 ${stat.color} group-hover:animate-pulse`}
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-60"></div>
                      </div>

                      {/* Value with counter animation effect */}
                      <div className="text-4xl font-black bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-2 font-mono">
                        {stat.value}
                      </div>

                      {/* Label */}
                      <div className="text-gray-300 text-sm font-medium tracking-wider uppercase">
                        {stat.label}
                      </div>

                      {/* Progress line */}
                      <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-1000 group-hover:w-full"
                          style={{ width: `${60 + index * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Futuristic Design */}
      <section className="py-32 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 relative overflow-hidden">
        {/* Advanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900/50 to-purple-900/50" />
          <div className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
          <div className="absolute inset-0 bg-grid-white-5 bg-[size:100px_100px] opacity-20" />

          {/* Floating tech elements */}
          <div className="absolute top-32 left-32 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-40"></div>
          <div className="absolute bottom-40 right-40 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-60 animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-3000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <Badge
              variant="outline"
              className="mb-8 border-cyan-400/30 text-cyan-300 bg-cyan-400/10 backdrop-blur-sm px-6 py-3 text-sm font-medium"
            >
              <Award className="w-4 h-4 mr-2 animate-pulse" />
              Tính năng nổi bật
            </Badge>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Tại sao chọn chúng tôi?
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-8 rounded-full"></div>
            <p className="text-gray-300 text-xl max-w-4xl mx-auto leading-relaxed">
              Trải nghiệm đặt cơm tuyệt vời với những tính năng được thiết kế để
              mang lại sự
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                {" "}
                tiện lợi và hài lòng tối đa
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group test relative overflow-hidden border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-700 hover:-translate-y-4"
              >
                {/* Holographic border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute inset-[1px] bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl"></div>

                <CardContent className="relative p-10">
                  {/* Icon with advanced effects */}
                  <div className="relative mb-8">
                    <div
                      className={`mx-auto w-24 h-24 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative overflow-hidden`}
                    >
                      {/* Glowing effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl group-hover:animate-pulse"></div>
                      <feature.icon className="h-12 w-12 text-white relative z-10" />
                    </div>
                    {/* Floating particles around icon */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-2 border-cyan-400 rounded-full animate-spin opacity-60"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-purple-400 rounded-full animate-bounce opacity-50"></div>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {feature.title}
                  </h3>

                  {/* Gradient separator */}
                  <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-6 rounded-full"></div>

                  {/* Description */}
                  <p className="text-gray-300 leading-relaxed text-center text-lg">
                    {feature.description}
                  </p>

                  {/* Tech indicators */}
                  <div className="mt-8 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-500"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-1000"></div>
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-6 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-1000 group-hover:w-full"
                      style={{ width: `${70 + index * 15}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tech Status Banner */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center space-x-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-400/20 rounded-2xl px-10 py-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300 font-medium">
                  Hệ thống: Hoạt động
                </span>
              </div>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse animation-delay-500"></div>
                <span className="text-gray-300 font-medium">
                  Đồng bộ: Kết nối
                </span>
              </div>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse animation-delay-1000"></div>
                <span className="text-gray-300 font-medium">
                  Bảo mật: Tối đa
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Futuristic Design */}
      <section className="py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute inset-0 bg-grid-white-5 bg-[size:60px_60px] opacity-30"></div>

          {/* Floating Particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40 animation-delay-1000"></div>
          <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-3000"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-30 animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <Badge
              variant="outline"
              className="mb-8 border-cyan-400/30 text-cyan-300 bg-cyan-400/10 backdrop-blur-sm px-6 py-2 text-sm font-medium"
            >
              <TrendingUp className="w-4 h-4 mr-2 animate-pulse" />
              Quy trình đặt cơm
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Cách thức hoạt động
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-8 rounded-full"></div>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
              Chỉ với 4 bước đơn giản, bạn có thể đặt cơm ngon mỗi ngày một cách
              <span className="text-cyan-400 font-semibold mx-2">
                nhanh chóng và tiện lợi
              </span>
            </p>
          </div>

          {/* Futuristic Steps Timeline */}
          <div className="relative">
            {/* Central Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-purple-400 to-pink-400 transform -translate-x-1/2 rounded-full">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 via-purple-400 to-pink-400 rounded-full animate-pulse opacity-50"></div>
            </div>

            {/* Steps */}
            <div className="space-y-32 lg:space-y-40">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Timeline Node */}
                  <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-ping opacity-30"></div>
                  </div>

                  {/* Step Content */}
                  <div
                    className={`w-full lg:w-5/12 ${
                      index % 2 === 0 ? "lg:pr-16" : "lg:pl-16"
                    }`}
                  >
                    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-700 hover:-translate-y-2">
                      {/* Holographic Border Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-xl blur-sm group-hover:blur-none transition-all duration-500"></div>
                      <div className="absolute inset-[1px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl"></div>

                      <CardContent className="relative p-8">
                        {/* Step Header */}
                        <div className="flex items-center space-x-4 mb-6">
                          {/* Step Number */}
                          <div
                            className={`w-16 h-16 ${step.color} rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500`}
                          >
                            <span className="text-xl font-bold text-white">
                              {step.number}
                            </span>
                          </div>

                          {/* Icon */}
                          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-xl flex items-center justify-center border border-cyan-400/30 group-hover:rotate-6 transition-all duration-500">
                            <step.icon className="h-8 w-8 text-cyan-400" />
                          </div>

                          {/* Title */}
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                              {step.title}
                            </h3>
                            <div className="w-20 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></div>
                          </div>
                        </div>

                        <p className="text-gray-300 leading-relaxed text-lg">
                          {step.description}
                        </p>

                        {/* Tech Feature */}
                        <div className="mt-4">
                          {index === 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-cyan-400/10 text-cyan-300 border-cyan-400/20 px-3 py-1"
                            >
                              <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                              Đăng ký dễ dàng
                            </Badge>
                          )}
                          {index === 1 && (
                            <Badge
                              variant="secondary"
                              className="bg-green-400/10 text-green-300 border-green-400/20 px-3 py-1"
                            >
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                              Menu được cập nhật
                            </Badge>
                          )}
                          {index === 2 && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-400/10 text-orange-300 border-orange-400/20 px-3 py-1"
                            >
                              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
                              Đặt hàng nhanh chóng
                            </Badge>
                          )}
                          {index === 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-400/10 text-emerald-300 border-emerald-400/20 px-3 py-1"
                            >
                              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                              Nhận cơm đúng giờ
                            </Badge>
                          )}
                        </div>

                        {/* Simple Progress */}
                        <div className="mt-6 flex items-center space-x-3">
                          <div className="w-8 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></div>
                          <span className="text-cyan-400 text-sm font-medium">
                            Bước {index + 1}/4
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Animated Connector (mobile) */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center my-8">
                      <div className="w-1 h-16 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full animate-pulse opacity-50"></div>
                        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-bounce"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Simple Tech Banner */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-cyan-400/20 rounded-xl px-6 py-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300 text-sm">
                Hệ thống hoạt động ổn định 24/7
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Futuristic Design */}
      {!user && (
        <section className="py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
          {/* Advanced Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-indigo-900/90" />

            {/* Animated geometric shapes */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-1000" />

            {/* Tech grid pattern */}
            <div className="absolute inset-0 bg-grid-white-5 bg-[size:120px_120px] opacity-15" />

            {/* Floating particles */}
            <div className="absolute top-32 left-32 w-3 h-3 bg-cyan-400 rounded-full animate-ping opacity-50"></div>
            <div className="absolute bottom-32 right-32 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-60 animation-delay-1000"></div>
            <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-40 animation-delay-2000"></div>
            <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-55 animation-delay-3000"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl">
              {/* Holographic border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 rounded-xl blur-sm"></div>
              <div className="absolute inset-[1px] bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl"></div>

              <CardContent className="relative text-center py-24 px-12">
                <div className="max-w-5xl mx-auto">
                  {/* Futuristic Icon */}
                  <div className="relative mb-12">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-8 hover:scale-110 transition-all duration-500">
                      <Sparkles className="h-20 w-20 text-cyan-400 animate-pulse" />
                    </div>
                    {/* Floating particles around icon */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 border-2 border-cyan-400 rounded rotate-45 animate-spin opacity-60"></div>
                    <div className="absolute -top-2 -right-6 w-6 h-6 bg-purple-400 rounded-full animate-bounce opacity-50"></div>
                    <div className="absolute -bottom-4 left-6 w-4 h-10 bg-gradient-to-t from-pink-400 to-transparent rounded-full animate-pulse opacity-70"></div>
                    <div className="absolute -bottom-2 -right-4 w-10 h-4 bg-gradient-to-r from-orange-400 to-transparent rounded-full animate-pulse animation-delay-1000 opacity-60"></div>
                  </div>

                  {/* Title with advanced effects */}
                  <div className="relative mb-8">
                    <h2 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                      Sẵn sàng bắt đầu?
                    </h2>
                    <div className="w-40 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto mb-6 rounded-full"></div>
                  </div>

                  <div className="space-y-8 mb-16">
                    <p className="text-3xl md:text-4xl font-light text-gray-200 leading-relaxed">
                      Tham gia ngay để trải nghiệm dịch vụ đặt cơm
                      <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold mx-3">
                        tiện lợi và chất lượng cao
                      </span>
                    </p>
                    <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
                      Hàng ngàn khách hàng đã tin tưởng chúng tôi!
                    </p>

                    {/* Tech stats */}
                    <div className="flex flex-wrap justify-center gap-6 mt-12">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-300 border-emerald-400/30 px-6 py-3 text-lg"
                      >
                        <div className="w-3 h-3 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                        Độ tin cậy cao
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-300 border-blue-400/30 px-6 py-3 text-lg"
                      >
                        <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse animation-delay-500"></div>
                        Giao diện thân thiện
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-300 border-purple-400/30 px-6 py-3 text-lg"
                      >
                        <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse animation-delay-1000"></div>
                        Hỗ trợ tận tâm
                      </Badge>
                    </div>
                  </div>

                  {/* Futuristic Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-8 justify-center">
                    <Button
                      size="lg"
                      asChild
                      className="relative group text-2xl px-16 py-10 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 shadow-2xl border-0 font-bold overflow-hidden transition-all duration-500 hover:scale-105"
                    >
                      <Link href="/auth/signup">
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <UserPlus className="mr-4 h-8 w-8 relative z-10" />
                        <span className="relative z-10">Đăng ký miễn phí</span>
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      asChild
                      className="relative group text-2xl px-16 py-10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white hover:from-slate-700/50 hover:to-slate-600/50 border-2 border-cyan-400/30 hover:border-cyan-400/60 backdrop-blur-sm shadow-2xl font-bold transition-all duration-500 hover:scale-105"
                    >
                      <Link href="/auth/login">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10">Đã có tài khoản</span>
                      </Link>
                    </Button>
                  </div>

                  {/* System Status */}
                  <div className="mt-16 inline-flex items-center space-x-6 bg-gradient-to-r from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-cyan-400/20 rounded-2xl px-8 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300 text-sm font-medium">
                        Hệ thống hoạt động ổn định
                      </span>
                    </div>
                    <div className="w-px h-4 bg-gray-600"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse animation-delay-500"></div>
                      <span className="text-gray-300 text-sm font-medium">
                        Phiên bản mới nhất
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
