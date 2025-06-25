const moment = require("moment-timezone");
const TimeHelper = require("./timeHelper");

class TimeSlotManager {
  constructor() {
    this.timezone = "Asia/Ho_Chi_Minh";

    // Main ordering period for all weekdays
    this.orderingPeriod = {
      name: "Đặt Cơm Hôm Nay",
      emoji: "🍽️",
      orderStart: process.env.ORDER_START_TIME || "08:00",
      orderDeadline: process.env.ORDER_DEADLINE || "09:45",
      deliveryTime: process.env.DELIVERY_TIME || "12:00",
      isActive: true,
    };
  }

  // Check if current day is a working day (Monday to Friday)
  isWorkingDay(date = null) {
    const checkDate = date
      ? moment(date).tz(this.timezone)
      : moment().tz(this.timezone);
    const dayOfWeek = checkDate.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  }

  // Get current meal period information
  getCurrentMealPeriod() {
    const now = moment().tz(this.timezone);
    const currentTime = now.format("HH:mm");

    // Check if within ordering time
    if (
      currentTime >= this.orderingPeriod.orderStart &&
      currentTime <= this.orderingPeriod.orderDeadline
    ) {
      return {
        ...this.orderingPeriod,
        isOrderingTime: true,
        currentTime,
        timeRemaining: this.getTimeRemaining(this.orderingPeriod.orderDeadline),
      };
    }

    // Find next ordering period (next working day)
    const nextPeriod = this.getNextMealPeriod();

    return {
      name: "Ngoài giờ đặt món",
      emoji: "⏸️",
      isOrderingTime: false,
      currentTime,
      nextPeriod,
    };
  }

  // Get next meal period
  getNextMealPeriod() {
    const now = moment().tz(this.timezone);
    const currentTime = now.format("HH:mm");

    // Check if ordering period hasn't started today
    if (currentTime < this.orderingPeriod.orderStart) {
      return {
        ...this.orderingPeriod,
        date: null, // Same day
      };
    }

    // If past ordering time today, return next working day
    let nextDay = now.clone().add(1, "day");
    while (!this.isWorkingDay(nextDay)) {
      nextDay.add(1, "day");
    }

    return {
      ...this.orderingPeriod,
      date: nextDay.format("YYYY-MM-DD"),
    };
  }

  // Calculate time remaining until deadline
  getTimeRemaining(deadline) {
    const now = moment().tz(this.timezone);
    const deadlineTime = moment()
      .tz(this.timezone)
      .set({
        hour: parseInt(deadline.split(":")[0]),
        minute: parseInt(deadline.split(":")[1]),
        second: 0,
      });

    if (deadlineTime.isBefore(now)) {
      return "Đã hết hạn";
    }

    const duration = moment.duration(deadlineTime.diff(now));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  }

  // Create time slot embed for display
  createTimeSlotEmbed() {
    const currentPeriod = this.getCurrentMealPeriod();

    let color = 0x0099ff; // Blue default
    let title = "🕐 Thời Gian Đặt Cơm Hôm Nay";
    let description = "";

    if (!this.isWorkingDay()) {
      color = 0xff9900; // Orange
      title = "🏖️ Cuối Tuần - Không Có Dịch Vụ";
      description = "Dịch vụ đặt cơm chỉ hoạt động từ **Thứ 2 đến Thứ 6**";
    } else if (currentPeriod.isOrderingTime) {
      color = 0x00ff00; // Green
      description = `🟢 **Hiện tại đang mở đặt món!**\n⏱️ Còn lại: **${currentPeriod.timeRemaining}**`;
    } else {
      color = 0xff9900; // Orange
      description = "🔴 Hiện tại không trong giờ đặt món";
    }

    const fields = [];

    if (this.isWorkingDay()) {
      const isActive = currentPeriod.isOrderingTime;
      const status = isActive ? " **(ĐANG MỞ)**" : " **(ĐÓNG)**";
      const statusIcon = isActive ? "🟢" : "🔴";

      fields.push({
        name: `${statusIcon} ${this.orderingPeriod.emoji} ${this.orderingPeriod.name}${status}`,
        value: [
          `🕐 **Thời gian đặt:** ${this.orderingPeriod.orderStart} - ${this.orderingPeriod.orderDeadline}`,
          `🚚 **Giao hàng:** ${this.orderingPeriod.deliveryTime}`,
          `📅 **Áp dụng:** Thứ 2 - Thứ 6`,
        ].join("\n"),
        inline: false,
      });

      // Add current time info
      fields.push({
        name: "🕒 Thông Tin Hiện Tại",
        value: [
          `⏰ **Giờ hiện tại:** ${moment().tz(this.timezone).format("HH:mm")}`,
          `📅 **Ngày:** ${moment().tz(this.timezone).format("DD/MM/YYYY")}`,
          isActive
            ? `⏳ **Thời gian còn lại:** ${currentPeriod.timeRemaining}`
            : `⏭️ **Khung giờ tiếp theo:** ${
                currentPeriod.nextPeriod?.date ? "Ngày mai" : "Hôm nay"
              } lúc ${this.orderingPeriod.orderStart}`,
        ].join("\n"),
        inline: false,
      });
    }

    return {
      color,
      title,
      description,
      fields,
    };
  }

  // Check if current time is within any ordering period
  isOrderingTime() {
    return this.getCurrentMealPeriod().isOrderingTime;
  }

  // Get current meal period name
  getCurrentPeriodName() {
    const period = this.getCurrentMealPeriod();
    return period.isOrderingTime ? period.name : null;
  }

  // Check if current time is within ordering window
  isOrderingOpen() {
    const now = TimeHelper.currentTime();
    const today = TimeHelper.today();

    const startTime = `${today} ${this.orderingPeriod.orderStart}:00`;
    const endTime = `${today} ${this.orderingPeriod.orderDeadline}:00`;

    return now >= startTime && now <= endTime;
  }

  // Get ordering window info
  getOrderingWindow() {
    return {
      start: this.orderingPeriod.orderStart,
      end: this.orderingPeriod.orderDeadline,
      isOpen: this.isOrderingOpen(),
    };
  }

  // Get time until ordering starts/ends
  getTimeUntilNext() {
    const now = TimeHelper.currentTime();
    const today = TimeHelper.today();

    const startTime = `${today} ${this.orderingPeriod.orderStart}:00`;
    const endTime = `${today} ${this.orderingPeriod.orderDeadline}:00`;

    if (now < startTime) {
      return {
        status: "before_start",
        message: `Đặt món mở cửa lúc ${this.orderingPeriod.orderStart}`,
        timeUntil: startTime,
      };
    } else if (now <= endTime) {
      return {
        status: "open",
        message: `Đặt món đóng cửa lúc ${this.orderingPeriod.orderDeadline}`,
        timeUntil: endTime,
      };
    } else {
      return {
        status: "closed",
        message: "Hết giờ đặt món hôm nay",
        timeUntil: null,
      };
    }
  }
}

module.exports = new TimeSlotManager();
