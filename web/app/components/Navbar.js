"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  User,
  LogOut,
  ShoppingCart,
  BarChart3,
  Menu as MenuIcon,
  UtensilsCrossed,
  Home,
} from "lucide-react";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page after successful logout
      router.push("/");
      console.log("✅ Logged out and redirected to home");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const getUserInitials = (email) => {
    return email?.split("@")[0]?.slice(0, 2)?.toUpperCase() || "U";
  };

  const NavItems = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      <Link
        href="/"
        className={`${
          mobile ? "flex items-center space-x-2 px-2 py-3" : ""
        } text-sm font-medium text-muted-foreground hover:text-primary transition-colors`}
        onClick={onItemClick}
      >
        {mobile && <Home className="h-4 w-4" />}
        <span>Trang chủ</span>
      </Link>
      {user && (
        <>
          <Link
            href="/menu"
            className={`${
              mobile ? "flex items-center space-x-2 px-2 py-3" : ""
            } text-sm font-medium text-muted-foreground hover:text-primary transition-colors`}
            onClick={onItemClick}
          >
            {mobile && <UtensilsCrossed className="h-4 w-4" />}
            <span>Menu</span>
          </Link>
          <Link
            href="/orders"
            className={`${
              mobile ? "flex items-center space-x-2 px-2 py-3" : ""
            } text-sm font-medium text-muted-foreground hover:text-primary transition-colors`}
            onClick={onItemClick}
          >
            {mobile && <ShoppingCart className="h-4 w-4" />}
            <span>Đơn hàng của tôi</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FoodOrder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavItems />
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.user_metadata?.avatar_url}
                            alt={user.email}
                          />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.user_metadata?.full_name || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Hồ sơ</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="flex items-center">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Đơn hàng của tôi</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Đăng xuất</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu Button for authenticated users */}
                <div className="md:hidden">
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MenuIcon className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-[300px] sm:w-[400px]"
                    >
                      <div className="flex flex-col space-y-4 py-4">
                        {/* User Info */}
                        <div className="flex items-center space-x-3 pb-4 border-b">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.user_metadata?.avatar_url}
                              alt={user.email}
                            />
                            <AvatarFallback>
                              {getUserInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user.user_metadata?.full_name || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-col space-y-2">
                          <NavItems
                            mobile={true}
                            onItemClick={() => setIsMenuOpen(false)}
                          />
                          <Link
                            href="/profile"
                            className="flex items-center space-x-2 px-2 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            <span>Hồ sơ</span>
                          </Link>
                        </div>

                        {/* Sign Out */}
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-600"
                            onClick={() => {
                              handleSignOut();
                              setIsMenuOpen(false);
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Đăng xuất
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <>
                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center space-x-3">
                  <Button variant="ghost" asChild>
                    <Link href="/auth/login">Đăng nhập</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup">Đăng ký</Link>
                  </Button>
                </div>

                {/* Mobile Auth Menu */}
                <div className="md:hidden">
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MenuIcon className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <div className="flex flex-col space-y-4 py-4">
                        <NavItems
                          mobile={true}
                          onItemClick={() => setIsMenuOpen(false)}
                        />
                        <div className="pt-4 border-t space-y-3">
                          <Button variant="outline" className="w-full" asChild>
                            <Link
                              href="/auth/login"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Đăng nhập
                            </Link>
                          </Button>
                          <Button className="w-full" asChild>
                            <Link
                              href="/auth/signup"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Đăng ký
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
