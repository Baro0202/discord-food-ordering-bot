import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase-server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user stats
  const today = new Date().toISOString().split("T")[0];

  const [ordersResult, profileResult, todayMenuResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("*").eq("auth_user_id", user.id).single(),
    supabase.from("daily_menus").select("*").eq("menu_date", today).single(),
  ]);

  const recentOrders = ordersResult.data || [];
  const profile = profileResult.data;
  const todayMenu = todayMenuResult.data;

  // Calculate stats
  const totalOrders = recentOrders.length;
  const totalSpent = recentOrders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount || 0),
    0
  );
  const pendingOrders = recentOrders.filter(
    (order) => order.status === "pending"
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          Chào mừng trở lại, {profile?.full_name || user.email}! 👋
        </h1>
        <p className="text-brand-100">
          Hãy xem menu hôm nay và đặt món yêu thích của bạn
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-brand-600 mb-2">
            {totalOrders}
          </div>
          <div className="text-gray-600">Tổng đơn hàng</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {totalSpent.toLocaleString("vi-VN")}đ
          </div>
          <div className="text-gray-600">Tổng chi tiêu</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {pendingOrders}
          </div>
          <div className="text-gray-600">Đơn chờ xử lý</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">{todayMenu ? "✅" : "❌"}</div>
          <div className="text-gray-600">Menu hôm nay</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/menu"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">Xem Menu Hôm Nay</h3>
            <p className="text-gray-600">
              Khám phá các món ăn ngon được cập nhật mỗi ngày
            </p>
          </div>
        </Link>

        <Link
          href="/orders"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Đơn Hàng Của Tôi</h3>
            <p className="text-gray-600">
              Theo dõi lịch sử và trạng thái đơn hàng
            </p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-semibold mb-2">Hồ Sơ Cá Nhân</h3>
            <p className="text-gray-600">
              Cập nhật thông tin và tùy chọn cá nhân
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Đơn Hàng Gần Đây</h2>
          <Link href="/orders" className="text-brand-600 hover:text-brand-700">
            Xem tất cả →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">Đơn hàng #{order.id}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(order.items)
                        ? order.items
                            .map((item) => `${item.name} (x${item.quantity})`)
                            .join(", ")
                        : JSON.stringify(order.items)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {parseFloat(order.total_amount || 0).toLocaleString(
                        "vi-VN"
                      )}
                      đ
                    </div>
                    <div
                      className={`text-sm px-2 py-1 rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status === "completed"
                        ? "Hoàn thành"
                        : order.status === "pending"
                        ? "Chờ xử lý"
                        : order.status === "cancelled"
                        ? "Đã hủy"
                        : order.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🍽️</div>
            <p>Bạn chưa có đơn hàng nào</p>
            <Link href="/menu" className="btn btn-primary mt-4">
              Đặt món ngay
            </Link>
          </div>
        )}
      </div>

      {/* Today's Menu Preview */}
      {todayMenu && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Menu Hôm Nay</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-green-800">
                  Menu đã sẵn sàng! 🎉
                </div>
                <div className="text-green-600 text-sm">
                  {todayMenu.special_note ||
                    "Nhiều món ngon đang chờ bạn khám phá"}
                </div>
              </div>
              <Link href="/menu" className="btn btn-primary">
                Xem Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
