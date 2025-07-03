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
      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:60px_60px] opacity-20" />
        </div>

        <div className="relative container mx-auto px-4 py-24 lg:py-32 flex items-center min-h-screen">
          <div className="text-center max-w-5xl mx-auto">
            <div className="space-y-8">
              <Badge
                variant="secondary"
                className="mb-6 text-sm font-medium bg-white/10 text-white border-white/20 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                🎉 Hệ thống đặt cơm hàng ngày
              </Badge>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Đặt cơm ngon
                </span>
                <br />
                <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                  mỗi ngày
                </span>
              </h1>

              <p className="text-xl md:text-2xl lg:text-3xl mb-12 text-white/80 max-w-3xl mx-auto leading-relaxed">
                Giải pháp đặt cơm hiện đại cho team và công ty với giao diện
                <span className="text-yellow-300 font-semibold">
                  {" "}
                  thân thiện{" "}
                </span>
                và
                <span className="text-pink-300 font-semibold"> dễ sử dụng</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                {user ? (
                  <>
                    <Button
                      size="lg"
                      asChild
                      className="text-lg px-10 py-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl border-0"
                    >
                      <Link href="/menu">
                        <UtensilsCrossed className="mr-3 h-6 w-6" />
                        Xem Menu hôm nay
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      asChild
                      className="text-lg px-10 py-8 bg-white text-gray-900 hover:bg-gray-100 shadow-2xl"
                    >
                      <Link href="/orders">
                        <CheckCircle className="mr-3 h-6 w-6" />
                        Đơn hàng của tôi
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      asChild
                      className="text-lg px-10 py-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl border-0"
                    >
                      <Link href="/auth/signup">
                        <UserPlus className="mr-3 h-6 w-6" />
                        Đăng ký ngay
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-lg px-10 py-8 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm shadow-2xl"
                    >
                      <Link href="/auth/login">Đăng nhập</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <stat.icon
                      className={`h-8 w-8 mx-auto mb-3 ${stat.color}`}
                    />
                    <div className="text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-white/70 text-sm">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-blue-100/20 bg-[size:100px_100px] opacity-50" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-6 border-purple-200 text-purple-600"
            >
              <Award className="w-4 h-4 mr-2" />
              Tính năng nổi bật
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Trải nghiệm đặt cơm tuyệt vời với những tính năng được thiết kế để
              mang lại sự tiện lợi và hài lòng tối đa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
              >
                <CardHeader className="pb-6">
                  <div
                    className={`mx-auto w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-center">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-6 border-indigo-200 text-indigo-600"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Quy trình đặt hàng
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Cách thức hoạt động
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Quy trình đơn giản chỉ với 4 bước để bạn có thể thưởng thức bữa
              cơm ngon và chất lượng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative"
              >
                <CardHeader className="pb-6 text-center">
                  <div className="relative mb-6">
                    <div
                      className={`mx-auto w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <span className="text-2xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                    <div className="mx-auto w-16 h-16 bg-white rounded-xl flex items-center justify-center -mt-8 relative z-10 shadow-lg border">
                      <step.icon className="h-8 w-8 text-gray-700" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 transform -translate-y-1/2" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-32 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
          </div>

          <div className="container mx-auto px-4 relative">
            <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
              <CardContent className="text-center py-20 px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8">
                    <Sparkles className="h-16 w-16 mx-auto text-yellow-300 mb-6" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                    Sẵn sàng bắt đầu?
                  </h2>
                  <p className="text-white/80 text-xl mb-12 leading-relaxed max-w-2xl mx-auto">
                    Tham gia ngay để trải nghiệm dịch vụ đặt cơm tiện lợi và
                    chất lượng cao. Hàng ngàn khách hàng đã tin tưởng chúng tôi!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Button
                      size="lg"
                      asChild
                      className="text-xl px-12 py-8 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 shadow-2xl border-0 font-bold"
                    >
                      <Link href="/auth/signup">
                        <UserPlus className="mr-3 h-6 w-6" />
                        Đăng ký miễn phí
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-xl px-12 py-8 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm shadow-2xl"
                    >
                      <Link href="/auth/login">Đã có tài khoản</Link>
                    </Button>
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
