import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import SecurityWrapper from "./components/SecurityWrapper";
import SecurityToggle from "./components/SecurityToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Food Ordering System",
  description: "Hệ thống đặt cơm hàng ngày",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          <SecurityWrapper>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </SecurityWrapper>
          <SecurityToggle />
        </AuthProvider>
      </body>
    </html>
  );
}
