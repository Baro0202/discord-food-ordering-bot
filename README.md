# 🍽️ Discord Food Ordering Bot

Bot Discord giúp quản lý đặt cơm hàng ngày cho team/công ty với tính năng đầy đủ từ hiển thị menu, đặt hàng, thanh toán đến quản lý đơn hàng.

## ✨ Tính năng chính

### 👥 Cho Members

- 🍽️ **Xem menu hàng ngày** - Menu được cập nhật tự động mỗi ngày
- 🛒 **Đặt món và quản lý giỏ hàng** - Chọn món, điều chỉnh số lượng dễ dàng
- 📋 **Lịch sử đặt hàng** - Theo dõi các đơn hàng đã đặt
- ⏰ **Nhắc nhở tự động** - Bot sẽ nhắc nhở khi sắp hết hạn đặt món
- 🔔 **Thông báo trạng thái đơn hàng** - Cập nhật realtime về đơn hàng

### 🔧 Cho Admin

- 📝 **Quản lý menu** - Thêm/sửa/xóa món ăn, thiết lập menu hàng ngày
- 📊 **Quản lý đơn hàng** - Xem, cập nhật trạng thái đơn hàng
- 📈 **Thống kê doanh thu** - Báo cáo chi tiết theo ngày/tuần/tháng
- ⚙️ **Cấu hình bot** - Thiết lập thời gian đặt hàng, giao hàng
- 💳 **Quản lý thanh toán** - Theo dõi trạng thái thanh toán

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js 16.9.0 trở lên
- NPM hoặc Yarn
- Discord Bot Token
- SQLite (đã bao gồm)

### 1. Clone dự án

\`\`\`bash
git clone <repository-url>
cd discord-food-ordering-bot
\`\`\`

### 2. Cài đặt dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Cấu hình môi trường

Sao chép file \`env.example\` thành \`.env\` và điền thông tin:

\`\`\`bash
cp env.example .env
\`\`\`

Chỉnh sửa file \`.env\`:
\`\`\`env

# Discord Bot Configuration

DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_discord_server_id_here

# Bot Configuration

ADMIN_ROLE_ID=your_admin_role_id_here
ORDER_CHANNEL_ID=your_order_channel_id_here
\`\`\`

### 4. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo New Application
3. Vào tab "Bot" và tạo bot
4. Copy Bot Token vào file \`.env\`
5. Vào tab "OAuth2" > "URL Generator":
   - Chọn scope: \`bot\`, \`applications.commands\`
   - Chọn quyền: \`Send Messages\`, \`Use Slash Commands\`, \`Embed Links\`, \`Read Message History\`
6. Mời bot vào server bằng URL được tạo

### 5. Chạy bot

\`\`\`bash
npm start
\`\`\`

Để chạy ở chế độ development:
\`\`\`bash
npm run dev
\`\`\`

## 📖 Hướng dẫn sử dụng

### Lệnh cơ bản

#### Cho Members:

- \`/menu\` - Xem menu hôm nay và đặt món

#### Cho Admin:

- \`/admin additem\` - Thêm món ăn mới
- \`/admin setmenu\` - Thiết lập menu cho ngày
- \`/admin orders\` - Xem danh sách đơn hàng
- \`/admin updateorder\` - Cập nhật trạng thái đơn hàng
- \`/admin listitems\` - Xem tất cả món ăn
- \`/admin stats\` - Xem thống kê

### Quy trình đặt hàng

1. **Member sử dụng** \`/menu\` để xem menu hôm nay
2. **Chọn món** từ dropdown menu
3. **Chọn số lượng** (1-5 phần)
4. **Xem giỏ hàng** và kiểm tra đơn hàng
5. **Đặt hàng** và xác nhận
6. **Thanh toán** (hiện tại là COD)

### Quy trình quản lý (Admin)

1. **Thêm món ăn** vào database với \`/admin additem\`
2. **Thiết lập menu hàng ngày** với \`/admin setmenu\`
3. **Theo dõi đơn hàng** với \`/admin orders\`
4. **Cập nhật trạng thái** khi chuẩn bị/giao hàng
5. **Xem thống kê** để theo dõi doanh thu

## ⏰ Lịch trình tự động

- **09:00** - Gửi thông báo menu hôm nay
- **09:45** - Nhắc nhở sắp hết hạn đặt món
- **10:00** - Hết hạn đặt món
- **12:00** - Thời gian giao hàng (có thể tùy chỉnh)

## 🗂️ Cấu trúc dự án

\`\`\`
src/
├── commands/ # Slash commands
│ ├── menu.js # Lệnh xem menu và đặt món
│ └── admin.js # Các lệnh quản trị
├── events/ # Discord event handlers
│ ├── ready.js # Bot ready event + cron jobs
│ └── interactionCreate.js # Xử lý interactions
├── handlers/ # Business logic handlers
│ ├── buttonHandlers.js # Xử lý button clicks
│ └── selectMenuHandlers.js # Xử lý select menus
├── database/ # Database layer
│ └── database.js # SQLite database class
├── utils/ # Utilities
│ └── deployCommands.js # Deploy slash commands
└── index.js # Main bot file
\`\`\`

## 🗄️ Database Schema

### menu_items

- Lưu thông tin các món ăn (tên, giá, mô tả, hình ảnh, danh mục)

### daily_menus

- Menu của từng ngày cụ thể

### orders

- Thông tin đơn hàng của users

### users

- Thông tin users và preferences

### settings

- Cấu hình bot

## 🔧 Tùy chỉnh

### Thay đổi thời gian đặt hàng

Chỉnh sửa trong file \`src/events/ready.js\`:
\`\`\`javascript
// Thay đổi thời gian nhắc nhở (hiện tại 9:00)
cron.schedule('0 9 \* \* 1-5', async () => {
// Code nhắc nhở
});
\`\`\`

### Thêm phương thức thanh toán

Tích hợp trong file \`src/handlers/buttonHandlers.js\` tại hàm \`handlePaymentButton\`:
\`\`\`javascript
// Tích hợp Stripe, PayPal, VNPay, etc.
\`\`\`

### Tùy chỉnh embed colors và messages

Thay đổi các giá trị hex color và text trong các file handlers.

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to branch (\`git push origin feature/AmazingFeature\`)
5. Tạo Pull Request

## 📝 Roadmap

- [ ] Tích hợp thanh toán online (Stripe/VNPay)
- [ ] Web dashboard cho admin
- [ ] Hỗ trợ nhiều loại tiền tệ
- [ ] Export báo cáo Excel/PDF
- [ ] Hỗ trợ đặt trước cho nhiều ngày
- [ ] Tích hợp với API giao hàng
- [ ] Mobile app companion
- [ ] AI chatbot cho support

## 📄 License

Dự án này được phân phối dưới [MIT License](LICENSE).

## 🆘 Hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi:

1. Kiểm tra [Issues](https://github.com/your-repo/issues)
2. Tạo issue mới với tag phù hợp
3. Liên hệ team development

## 🙏 Cảm ơn

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [SQLite](https://www.sqlite.org/) - Database engine
- [Node-cron](https://github.com/kelektiv/node-cron) - Cron job scheduler
- [Moment.js](https://momentjs.com/) - Date handling

---

Made with ❤️ for productive teams
# discord-food-ordering-bot
# discord-food-ordering-bot
