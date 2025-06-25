const moment = require("moment-timezone");

const TIMEZONE = "Asia/Ho_Chi_Minh";

class TimeHelper {
  /**
   * Get current time in Vietnam timezone
   */
  static now() {
    return moment().tz(TIMEZONE);
  }

  /**
   * Get current date in YYYY-MM-DD format (Vietnam timezone)
   */
  static today() {
    return moment().tz(TIMEZONE).format("YYYY-MM-DD");
  }

  /**
   * Get current time in HH:mm format (Vietnam timezone)
   */
  static currentTime() {
    return moment().tz(TIMEZONE).format("HH:mm");
  }

  /**
   * Get current timestamp for Discord embeds (Vietnam timezone)
   */
  static embedTimestamp() {
    return moment().tz(TIMEZONE).toDate();
  }

  /**
   * Get UTC timestamp for database storage
   */
  static utcTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Convert UTC timestamp to Vietnam timezone
   */
  static fromUTC(utcTimestamp) {
    return moment.utc(utcTimestamp).tz(TIMEZONE);
  }

  /**
   * Format date for display (Vietnam timezone)
   */
  static formatDate(date, format = "DD/MM/YYYY") {
    if (!date) return "N/A";
    return moment.utc(date).tz(TIMEZONE).format(format);
  }

  /**
   * Format datetime for display (Vietnam timezone)
   */
  static formatDateTime(date, format = "DD/MM/YYYY HH:mm") {
    if (!date) return "N/A";
    return moment.utc(date).tz(TIMEZONE).format(format);
  }

  /**
   * Check if current time is between start and end time (Vietnam timezone)
   */
  static isBetweenTime(startTime, endTime) {
    const now = this.currentTime();
    return now >= startTime && now <= endTime;
  }

  /**
   * Check if current time is past the deadline (Vietnam timezone)
   */
  static isPastDeadline(deadline) {
    const now = this.currentTime();
    return now > deadline;
  }

  /**
   * Check if current time is before start time (Vietnam timezone)
   */
  static isBeforeStartTime(startTime) {
    const now = this.currentTime();
    return now < startTime;
  }

  /**
   * Get time remaining until deadline
   */
  static getTimeRemaining(deadline) {
    const now = moment().tz(TIMEZONE);
    const deadlineTime = moment()
      .tz(TIMEZONE)
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

  /**
   * Create moment object in Vietnam timezone
   */
  static createMoment(date = null) {
    if (date) {
      return moment(date).tz(TIMEZONE);
    }
    return moment().tz(TIMEZONE);
  }

  /**
   * Get timezone info
   */
  static getTimezone() {
    return TIMEZONE;
  }
}

module.exports = TimeHelper;
