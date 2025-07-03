"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  UtensilsCrossed,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  Building2,
} from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user, signUp, validateEmailDomain } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/menu");
    }
  }, [user, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!validateEmailDomain(formData.email)) {
      setError("Chỉ cho phép đăng ký với email @ticketbox.vn");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
      });

      if (error) {
        setError(error.message || "Có lỗi xảy ra khi đăng ký");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength =
    formData.password.length >= 8
      ? "strong"
      : formData.password.length >= 6
      ? "medium"
      : "weak";
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Đăng ký thành công!
              </CardTitle>
              <CardDescription>
                Chúng tôi đã gửi email xác nhận đến{" "}
                <strong>{formData.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Vui lòng kiểm tra email và click vào link để kích hoạt tài
                khoản.
              </p>
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Link href="/auth/login">Đăng nhập ngay</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">Về trang chủ</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 mb-6 group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FoodOrder
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Tạo tài khoản TicketBox
          </h1>
          <p className="mt-2 text-muted-foreground">
            Đăng ký với email TicketBox để bắt đầu đặt món
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl flex items-center justify-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span>Đăng ký</span>
            </CardTitle>
            <CardDescription>
              Sử dụng email TicketBox để tạo tài khoản
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email TicketBox</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="tên@ticketbox.vn"
                  />
                </div>
                <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                  💼 Chỉ cho phép email với domain{" "}
                  <strong>@ticketbox.vn</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                  />
                </div>
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="flex space-x-1">
                      <div
                        className={`h-1.5 w-8 rounded ${
                          passwordStrength === "weak"
                            ? "bg-red-400"
                            : passwordStrength === "medium"
                            ? "bg-yellow-400"
                            : "bg-green-400"
                        }`}
                      ></div>
                      <div
                        className={`h-1.5 w-8 rounded ${
                          passwordStrength === "medium" ||
                          passwordStrength === "strong"
                            ? passwordStrength === "medium"
                              ? "bg-yellow-400"
                              : "bg-green-400"
                            : "bg-gray-200"
                        }`}
                      ></div>
                      <div
                        className={`h-1.5 w-8 rounded ${
                          passwordStrength === "strong"
                            ? "bg-green-400"
                            : "bg-gray-200"
                        }`}
                      ></div>
                    </div>
                    <span
                      className={
                        passwordStrength === "weak"
                          ? "text-red-600"
                          : passwordStrength === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }
                    >
                      {passwordStrength === "weak"
                        ? "Yếu"
                        : passwordStrength === "medium"
                        ? "Trung bình"
                        : "Mạnh"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Nhập lại mật khẩu"
                  />
                  {formData.confirmPassword && (
                    <div className="absolute right-3 top-3">
                      {passwordsMatch ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordsMatch}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tạo tài khoản...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Tạo tài khoản TicketBox
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground">
                Đã có tài khoản TicketBox?{" "}
                <Button
                  variant="link"
                  asChild
                  className="p-0 h-auto font-semibold text-blue-600"
                >
                  <Link href="/auth/login">Đăng nhập ngay</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            asChild
            className="text-gray-600 hover:text-blue-600"
          >
            <Link href="/">← Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
