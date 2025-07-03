import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Mail,
  Phone,
  Clock,
  MapPin,
  Twitter,
  Facebook,
  Instagram,
  Github,
  Heart,
  ExternalLink,
} from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Menu hôm nay", href: "/menu" },
    { label: "Đơn hàng của tôi", href: "/orders" },
    { label: "Hồ sơ cá nhân", href: "/profile" },
  ];

  const supportLinks = [
    { label: "Hướng dẫn sử dụng", href: "/help" },
    { label: "Câu hỏi thường gặp", href: "/faq" },
    { label: "Liên hệ hỗ trợ", href: "/contact" },
    { label: "Chính sách bảo mật", href: "/privacy" },
    { label: "Điều khoản dịch vụ", href: "/terms" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Github, href: "#", label: "Github" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white border-t border-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:60px_60px] opacity-20" />
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">FoodOrder</span>
              </Link>

              <p className="text-gray-300 leading-relaxed">
                Hệ thống đặt cơm hàng ngày hiện đại cho team và công ty. Mang
                đến trải nghiệm đặt món tiện lợi và chất lượng cao.
              </p>

              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                  Đang hoạt động
                </Badge>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Theo dõi chúng tôi</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-10 h-10 p-0 hover:bg-white/10 border border-gray-700 hover:border-gray-600 transition-all duration-300"
                  >
                    <Link href={social.href} aria-label={social.label}>
                      <social.icon className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <UtensilsCrossed className="h-5 w-5 mr-2 text-purple-400" />
              Liên kết nhanh
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0 text-gray-300 hover:text-white justify-start"
                  >
                    <Link href={link.href} className="flex items-center group">
                      <ExternalLink className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-400" />
              Hỗ trợ
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0 text-gray-300 hover:text-white justify-start"
                  >
                    <Link href={link.href} className="flex items-center group">
                      <ExternalLink className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <Phone className="h-5 w-5 mr-2 text-green-400" />
              Liên hệ
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Email hỗ trợ</p>
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0 text-white hover:text-blue-400"
                  >
                    <a href="mailto:support@foodorder.com">
                      support@foodorder.com
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Hotline</p>
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0 text-white hover:text-green-400"
                  >
                    <a href="tel:+84123456789">0123 456 789</a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Giờ làm việc</p>
                  <p className="text-white text-sm">8:00 - 17:00 (T2-T6)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Địa chỉ</p>
                  <p className="text-white text-sm">
                    123 Nguyễn Văn A, Q1, TP.HCM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-12 bg-gray-700" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-gray-400">
            <p className="text-sm">
              © {currentYear} FoodOrder System. All rights reserved.
            </p>
            <Badge
              variant="outline"
              className="border-gray-600 text-gray-400 bg-transparent"
            >
              Made with <Heart className="h-3 w-3 mx-1 text-red-400" /> in
              Vietnam
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <Button
              variant="link"
              asChild
              className="h-auto p-0 text-gray-400 hover:text-white"
            >
              <Link href="/privacy">Privacy</Link>
            </Button>
            <span>•</span>
            <Button
              variant="link"
              asChild
              className="h-auto p-0 text-gray-400 hover:text-white"
            >
              <Link href="/terms">Terms</Link>
            </Button>
            <span>•</span>
            <Button
              variant="link"
              asChild
              className="h-auto p-0 text-gray-400 hover:text-white"
            >
              <Link href="/cookies">Cookies</Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};
