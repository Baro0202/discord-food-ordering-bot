# 🌏 Cập Nhật Timezone - Vietnam Time (UTC+7)

## Tổng Quan

Đã thực hiện cập nhật toàn bộ hệ thống để đảm bảo:

- **Database**: Lưu trữ UTC+0 (chuẩn quốc tế)
- **Hiển thị**: Chuyển đổi sang UTC+7 (giờ Việt Nam)
- **Logic**: Xử lý thời gian theo UTC+7
- **Cron jobs**: Chạy đúng giờ Việt Nam

## Thay Đổi Chính

### 1. 🕘 Thời Gian Đặt Cơm Mới

- **Trước**: 8:00 - 11:00
- **Sau**: 9:00 - 10:00
- **Nhắc nhở**: 9:00 AM (mở đặt) và 9:45 AM (còn 15 phút)

### 2. 🛠️ TimeHelper Utility

Tạo file `src/utils/timeHelper.js` để quản lý timezone nhất quán:

```javascript
const TimeHelper = require("../utils/timeHelper");

// Sử dụng:
TimeHelper.today(); // YYYY-MM-DD (VN timezone)
TimeHelper.currentTime(); // HH:mm (VN timezone)
TimeHelper.embedTimestamp(); // Cho Discord embeds
TimeHelper.utcTimestamp(); // Cho database
TimeHelper.formatDate(); // Format hiển thị
TimeHelper.formatDateTime(); // Format hiển thị với giờ
```

### 3. 🔧 Files Đã Cập Nhật

#### Core Files:

- `src/index.js` - Main bot file, cron jobs
- `src/utils/timeHelper.js` - Timezone utility (NEW)
- `src/utils/timeSlots.js` - Time slot manager

#### Commands:

- `src/commands/menu.js` - Menu command
- `src/commands/timeslots.js` - Timeslots command
- `src/commands/myorders.js` - My orders command
- `src/commands/pay.js` - Payment command

#### Handlers:

- `src/handlers/buttonHandlers.js` - Button interactions
- `src/handlers/selectMenuHandlers.js` - Select menu interactions

#### Events:

- `src/events/ready.js` - Bot ready event (đã xóa duplicate cron jobs)

### 4. 🗃️ Database Strategy

- **Lưu trữ**: UTC+0 timestamps (chuẩn)
- **Truy vấn**: Convert UTC sang VN time khi hiển thị
- **Tạo mới**: Lưu UTC, hiển thị VN time

### 5. ⏰ Cron Jobs Update

```javascript
// Cron jobs chạy theo timezone Vietnam
{
  timezone: "Asia/Ho_Chi_Minh";
}

// Schedule:
("0 9 * * 1-5"); // 9:00 AM - Menu reminder
("45 9 * * 1-5"); // 9:45 AM - Deadline reminder (15 min before)
```

### 6. 🔄 Migration Pattern

**Trước:**

```javascript
const today = moment().format("YYYY-MM-DD");
const currentTime = moment().format("HH:mm");
timestamp: new Date().setTimestamp();
```

**Sau:**

```javascript
const today = TimeHelper.today();
const currentTime = TimeHelper.currentTime();
timestamp: TimeHelper.embedTimestamp().setTimestamp(
  TimeHelper.embedTimestamp()
);
```

## Environment Variables

```env
# New ordering schedule
ORDER_START_TIME=09:00
ORDER_DEADLINE=10:00
DELIVERY_TIME=12:00
```

## Kiểm Tra Timezone

### 1. Health Check

```bash
curl http://localhost:8386/health
```

- `timestamp` field shows UTC for logging
- Bot logic uses VN timezone internally

### 2. Menu Command Test

- Kiểm tra thời gian đặt món: 9:00-10:00
- Kiểm tra hiển thị ngày tháng đúng format VN

### 3. Cron Jobs

- 9:00 AM VN: Menu reminder
- 9:45 AM VN: Deadline reminder

## Lợi Ích

### ✅ Consistency

- Tất cả thời gian đều theo chuẩn Vietnam
- Không còn trùng lặp timezone logic

### ✅ Maintainability

- Centralized timezone management
- Easy to change timezone rules

### ✅ User Experience

- Đúng giờ Việt Nam
- Thông báo đúng lúc
- Hiển thị thời gian chính xác

### ✅ Database Integrity

- UTC storage (international standard)
- Consistent with other systems

## Testing

### Manual Tests

1. **Time Display**: Kiểm tra format ngày/giờ trong embeds
2. **Order Window**: Test đặt món trong/ngoài giờ cho phép
3. **Cron Jobs**: Verify thông báo đúng giờ VN
4. **Database**: Verify timestamps stored as UTC

### Automated Health Check

```bash
# Bot status with timezone info
curl -s http://localhost:8386/health | jq .timestamp
```

## Troubleshooting

### Common Issues:

1. **Cron không chạy**: Check timezone setting trong container
2. **Thời gian sai**: Verify TimeHelper import
3. **Display issues**: Check formatDate/formatDateTime usage

### Debug Commands:

```javascript
console.log("Current VN time:", TimeHelper.now().format());
console.log("Current VN date:", TimeHelper.today());
console.log("Current VN time:", TimeHelper.currentTime());
```

## Next Steps

1. **Monitor**: Theo dõi cron jobs trong production
2. **Feedback**: Kiểm tra user feedback về thời gian
3. **Optimization**: Tối ưu timezone conversion nếu cần

---

**Cập nhật**: 04/06/2025
**Version**: 2.0.0
**Timezone**: Asia/Ho_Chi_Minh (UTC+7)
