# 🔄 Hướng Dẫn Sử Dụng `/admin updateorder`

## Tổng Quan

Command `/admin updateorder` đã được cải tiến để cho phép admin cập nhật cả **trạng thái đơn hàng** và **trạng thái thanh toán** với tính năng tự động gửi thông báo đến user.

## Cú Pháp Mới

```
/admin updateorder orderid:<ID> type:<loại> value:<giá trị>
```

### Tham Số

| Tham số   | Kiểu    | Bắt buộc | Mô tả                                             |
| --------- | ------- | -------- | ------------------------------------------------- |
| `orderid` | Integer | ✅       | ID đơn hàng cần cập nhật                          |
| `type`    | Choice  | ✅       | `status` (trạng thái) hoặc `payment` (thanh toán) |
| `value`   | String  | ✅       | Giá trị mới tương ứng với loại                    |

## Loại Cập Nhật

### 1. 📋 Trạng thái đơn hàng (`type: status`)

**Các giá trị hợp lệ:**

- `pending` - Chờ xử lý
- `confirmed` - Đã xác nhận
- `preparing` - Đang chuẩn bị
- `delivered` - Đã giao
- `cancelled` - Đã hủy

**Ví dụ:**

```
/admin updateorder orderid:123 type:status value:confirmed
/admin updateorder orderid:456 type:status value:preparing
```

### 2. 💳 Trạng thái thanh toán (`type: payment`)

**Các giá trị hợp lệ:**

- `pending` - Chờ thanh toán
- `paid` - Đã thanh toán ✨
- `failed` - Thanh toán thất bại
- `refunded` - Đã hoàn tiền

**Ví dụ:**

```
/admin updateorder orderid:123 type:payment value:paid
/admin updateorder orderid:456 type:payment value:failed
```

## 🎯 Tính Năng Đặc Biệt: Thông Báo Thanh Toán

### Khi update `payment_status = "paid"`

**Bot sẽ tự động:**

1. ✅ **Gửi DM đến user** với thông báo thanh toán thành công
2. 📢 **Gửi thông báo đến admin channel** (nếu có cấu hình)
3. 📊 **Cập nhật logs** chi tiết

### Nội dung thông báo gửi đến user:

```
✅ Thanh toán đã được xác nhận!

Chào [Tên user]!

Đơn hàng #123 của bạn đã được thanh toán thành công.

🍽️ Chi tiết đơn hàng:
• Cơm gà x1
• Canh chua x1

💰 Số tiền đã thanh toán: 50,000 VND
📅 Ngày giao hàng: 15/01/2024
🔄 Trạng thái hiện tại: ✅ Đã thanh toán - Chuẩn bị giao hàng

Cảm ơn bạn đã sử dụng dịch vụ đặt cơm!
```

## Ví Dụ Sử Dụng

### Scenario 1: Xác nhận thanh toán

```
/admin updateorder orderid:50 type:payment value:paid
```

**Kết quả:**

- ✅ Cập nhật payment_status = "paid" trong database
- 💬 Gửi DM xác nhận đến user
- 📢 Thông báo đến admin channel
- 📋 Hiển thị kết quả cho admin

### Scenario 2: Cập nhật trạng thái đơn hàng

```
/admin updateorder orderid:50 type:status value:preparing
```

**Kết quả:**

- ✅ Cập nhật status = "preparing" trong database
- 📋 Hiển thị kết quả cho admin
- ❌ Không gửi thông báo đến user

### Scenario 3: Báo thanh toán thất bại

```
/admin updateorder orderid:50 type:payment value:failed
```

**Kết quả:**

- ✅ Cập nhật payment_status = "failed" trong database
- 📋 Hiển thị kết quả cho admin
- ❌ Không gửi thông báo đến user

## 🛡️ Validation & Error Handling

### ❌ Lỗi thường gặp:

**1. Order ID không tồn tại**

```
❌ Không tìm thấy đơn hàng với ID này!
```

**2. Giá trị không hợp lệ**

```
❌ Giá trị không hợp lệ
Trạng thái thanh toán phải là một trong: pending, paid, failed, refunded
```

**3. Không thể gửi DM đến user**

```
⚠️ Đã cập nhật đơn hàng nhưng không thể gửi thông báo đến user (Cannot send messages to this user)
```

## 📊 Workflow Khuyến Nghị

### Quy trình xác nhận thanh toán:

1. **User chuyển khoản** và báo admin
2. **Admin kiểm tra** bank/MoMo transaction
3. **Admin xác nhận:**
   ```
   /admin updateorder orderid:123 type:payment value:paid
   ```
4. **User nhận thông báo** xác nhận tự động
5. **Admin cập nhật trạng thái:**
   ```
   /admin updateorder orderid:123 type:status value:preparing
   ```

### Quy trình giao hàng:

1. **Bếp chuẩn bị xong:**

   ```
   /admin updateorder orderid:123 type:status value:confirmed
   ```

2. **Bắt đầu giao:**

   ```
   /admin updateorder orderid:123 type:status value:preparing
   ```

3. **Giao thành công:**
   ```
   /admin updateorder orderid:123 type:status value:delivered
   ```

## 🔧 Debugging & Logs

**Console logs để theo dõi:**

```
[DEBUG] UpdateOrder - ID: 123, Type: payment, Value: paid
[INFO] Sending payment confirmation to user 1329624897588170856
[INFO] Payment confirmation sent to user 1329624897588170856 for order #123
```

**Health check:**

```bash
# Kiểm tra logs
docker logs food-ordering-bot-prod --tail 20

# Test command
/admin updateorder orderid:999 type:payment value:test  # Should show validation error
```

## 💡 Tips & Best Practices

1. **Luôn xác nhận thanh toán trước** khi update status
2. **Kiểm tra bank statement** trước khi set `paid`
3. **Sử dụng admin channel** để team cùng theo dõi
4. **Log mọi thay đổi** để audit trail
5. **Test với order nhỏ** trước khi deploy production

---

**Cập nhật:** Version 2.0
**Tính năng mới:** Auto user notification for payment confirmation
**Tương thích:** Discord.js v14, Supabase
