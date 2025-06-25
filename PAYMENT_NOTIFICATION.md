# 🔔 Tính Năng Gửi Thông Báo Thanh Toán

## Tổng Quan

Tính năng **Gửi Thông Báo Thanh Toán** cho phép admin gửi thông báo nhắc nhở thanh toán tiền cơm đến tất cả người dùng có đơn hàng chưa thanh toán một cách tự động và hiệu quả.

## Lệnh Sử Dụng

```
/admin sendpaymentnotify [date] [message]
```

### Tham Số

| Tham số   | Kiểu   | Bắt buộc | Mô tả                                                  |
| --------- | ------ | -------- | ------------------------------------------------------ |
| `date`    | String | ❌       | Ngày cần gửi thông báo (YYYY-MM-DD). Mặc định: hôm nay |
| `message` | String | ❌       | Tin nhắn tùy chỉnh thêm vào thông báo                  |

## Tính Năng Chính

### 🎯 Tự Động Nhóm Đơn Hàng

- Hệ thống tự động nhóm tất cả đơn hàng chưa thanh toán theo từng người dùng
- Tính tổng tiền cần thanh toán cho mỗi người

### 💬 Gửi Tin Nhắn Riêng (DM)

- Gửi thông báo trực tiếp đến tin nhắn riêng của từng người dùng
- Đảm bảo privacy và hiệu quả thông báo

### 📊 Thông Tin Chi Tiết

- **Ngày giao hàng**: Hiển thị rõ ngày giao cơm
- **Số đơn hàng**: Tổng số đơn hàng chờ thanh toán
- **Tổng tiền**: Số tiền cần thanh toán
- **Chi tiết đơn hàng**: Danh sách món ăn và số lượng
- **Hướng dẫn thanh toán**: Các bước thanh toán cụ thể

### 🎯 Nút Hành Động Thông Minh

- **Đơn hàng đơn lẻ**: Nút "💳 Thanh toán ngay" để thanh toán trực tiếp
- **Nhiều đơn hàng**: Nút "💳 Xem tất cả đơn hàng" để xem tổng quan

### 📈 Báo Cáo Kết Quả

- Số lượng thông báo gửi thành công
- Số lượng thông báo gửi thất bại
- Danh sách người dùng không thể gửi được
- Tổng tiền chờ thanh toán

## Ví Dụ Sử Dụng

### 1. Gửi thông báo cho hôm nay

```
/admin sendpaymentnotify
```

### 2. Gửi thông báo cho ngày cụ thể

```
/admin sendpaymentnotify date:2024-01-15
```

### 3. Gửi thông báo với tin nhắn tùy chỉnh

```
/admin sendpaymentnotify message:"Hạn thanh toán là 15h hôm nay! Vui lòng thanh toán sớm để đảm bảo giao hàng đúng giờ."
```

### 4. Kết hợp cả hai

```
/admin sendpaymentnotify date:2024-01-15 message:"Khuyến mãi: Thanh toán trước 14h được giảm 5%!"
```

## Luồng Hoạt Động

1. **Admin thực hiện lệnh** → Hệ thống nhận yêu cầu
2. **Lọc đơn hàng** → Tìm tất cả đơn hàng `payment_status = "pending"`
3. **Nhóm theo người dùng** → Gộp các đơn hàng của cùng một user
4. **Gửi thông báo** → Gửi DM đến từng người dùng
5. **Báo cáo kết quả** → Hiển thị thống kê cho admin
6. **Thông báo admin channel** → Gửi thông báo đến channel quản trị (nếu có)

## Nội Dung Thông Báo Gửi Đến User

```
🔔 Thông báo thanh toán tiền cơm

Chào [Tên người dùng]!

Bạn có đơn hàng chưa thanh toán. Vui lòng thanh toán để đảm bảo việc giao hàng đúng hẹn.

📅 Ngày giao hàng: DD/MM/YYYY
📦 Số đơn hàng: X
💰 Tổng tiền cần thanh toán: XXX,XXX VND

🍽️ Chi tiết đơn hàng:
🛍️ Đơn hàng #123
• Cơm gà x1
• Canh chua x1
💰 50,000 VND

💳 Hướng dẫn thanh toán:
• Sử dụng lệnh /pay để xem chi tiết thanh toán
• Quét mã QR MoMo để thanh toán
• Sau khi chuyển khoản, nhấn nút ✅ Đã chuyển khoản
• Admin sẽ xác nhận và cập nhật trạng thái đơn hàng

Cảm ơn bạn đã sử dụng dịch vụ đặt cơm! Vui lòng thanh toán sớm.
```

## Lưu Ý Khi Sử Dụng

### ✅ Thành Công Khi

- Người dùng có bật nhận tin nhắn từ bot
- Bot có quyền gửi DM đến người dùng
- Đơn hàng có trạng thái `payment_status = "pending"`

### ❌ Thất Bại Khi

- Người dùng đã chặn bot hoặc tắt DM
- Người dùng không còn trong server
- Lỗi kết nối mạng

### 💡 Mẹo Sử Dụng

- **Thời điểm tốt nhất**: Gửi vào buổi sáng hoặc trước giờ ăn trưa
- **Tần suất**: Không nên gửi quá 2-3 lần/ngày để tránh spam
- **Tin nhắn tùy chỉnh**: Sử dụng để thông báo deadline hoặc khuyến mãi

## Cấu Hình Cần Thiết

Đảm bảo các biến môi trường được thiết lập:

```env
# File .env
ADMIN_USER_ID=your_admin_user_id
ORDER_CHANNEL_ID=your_order_channel_id (tùy chọn)
```

## Troubleshooting

### Vấn đề thường gặp:

**1. Không gửi được DM cho một số user**

- Nguyên nhân: User đã tắt DM từ server members
- Giải pháp: Yêu cầu user bật lại tính năng này trong Privacy Settings

**2. Thông báo không hiển thị đầy đủ**

- Nguyên nhân: Quá nhiều đơn hàng, vượt quá giới hạn embed
- Giải pháp: Hệ thống tự động cắt ngắn và thêm "..."

**3. Admin không nhận được báo cáo**

- Nguyên nhân: Lỗi permission hoặc channel không tồn tại
- Giải pháp: Kiểm tra ORDER_CHANNEL_ID và quyền bot

---

**Được phát triển bởi:** [Tên team]
**Phiên bản:** 1.0.0
**Cập nhật:** [Ngày hiện tại]
