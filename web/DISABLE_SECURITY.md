# Hướng dẫn tắt tạm thời bảo mật (Development Only)

## Tình huống

Nếu bạn đang trong quá trình development và modal cảnh báo bảo mật xuất hiện không đúng lúc (false positive), bạn có thể tạm thời tắt hệ thống bảo mật.

## Cách tắt bảo mật

### Phương pháp 1: Sử dụng localStorage (Khuyến nghị)

1. Mở DevTools (F12) trước khi vào website
2. Vào tab Console
3. Gõ lệnh: `localStorage.setItem('enable_security', 'false')`
4. Reload trang (F5)

### Phương pháp 2: Sử dụng biến môi trường

1. Tạo file `.env.local` trong thư mục `web/`
2. Thêm dòng: `NEXT_PUBLIC_ENABLE_SECURITY=false`
3. Restart development server

## Cách bật lại bảo mật

### Để bật lại bảo mật:

```javascript
localStorage.setItem("enable_security", "true");
// hoặc
localStorage.removeItem("enable_security");
```

## Lưu ý quan trọng

⚠️ **CHỈ DÀNH CHO DEVELOPMENT**

- Bảo mật sẽ LUÔN được bật trong production
- Không nên tắt bảo mật trên production environment
- Chỉ tắt khi thực sự cần thiết cho debugging

🔒 **Bảo mật tự động**

- Trên production: Bảo mật luôn bật
- Trên development: Bảo mật bật mặc định, có thể tắt thủ công
- Sau khi clear localStorage, bảo mật sẽ tự động bật lại

## Test bảo mật

Để test xem bảo mật có hoạt động:

1. Bật lại bảo mật (xóa localStorage setting)
2. Reload trang
3. Ấn F12 → Modal cảnh báo sẽ xuất hiện
4. Thử đặt hàng → API call sẽ bị chặn
