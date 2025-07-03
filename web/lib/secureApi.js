// Secure API wrapper that checks for DevTools before making requests
"use client";

class DevToolsDetector {
  static checkDevTools() {
    // Enhanced DevTools detection for API calls - synchronized with useDevToolsDetector
    let devtoolsOpen = false;

    try {
      // Method 1: Check if security modal is currently showing
      const warningModal = document.querySelector(".warning-modal");
      if (warningModal) {
        console.warn("🚫 [API-SECURITY] Warning modal is active - API blocked");
        return true;
      }

      // Method 2: Window size analysis (same as hook)
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const screenWidth = window.screen.availWidth;
      const screenHeight = window.screen.availHeight;
      const windowWidth = window.outerWidth;
      const windowHeight = window.outerHeight;

      // Use same conservative thresholds as hook
      const significantWidthDiff = widthDiff > 250;
      const significantHeightDiff = heightDiff > 250;

      const windowMuchSmallerThanScreen =
        (screenWidth - windowWidth > 400 &&
          screenHeight - windowHeight > 200) ||
        (screenHeight - windowHeight > 400 && screenWidth - windowWidth > 200);

      if (
        significantWidthDiff ||
        significantHeightDiff ||
        windowMuchSmallerThanScreen
      ) {
        devtoolsOpen = true;
        console.warn("🚫 [API-SECURITY] DevTools detected via window sizing");
      }

      // Method 3: Check for DevTools specific objects
      if (
        window.devtools ||
        (window.Firebug &&
          window.Firebug.chrome &&
          window.Firebug.chrome.isInitialized) ||
        typeof window.console.firebug === "string"
      ) {
        devtoolsOpen = true;
        console.warn("🚫 [API-SECURITY] DevTools detected via objects");
      }

      // Method 4: Check global flag set by useDevToolsDetector
      if (window.__devToolsDetected === true) {
        devtoolsOpen = true;
        console.warn("🚫 [API-SECURITY] DevTools detected via global flag");
      }
    } catch (error) {
      // If detection fails, assume DevTools is interfering
      console.warn(
        "🚫 [API-SECURITY] Detection error, blocking API:",
        error.message
      );
      devtoolsOpen = true;
    }

    return devtoolsOpen;
  }

  static isSecurityEnabled() {
    // In production, always enable security
    if (process.env.NODE_ENV === "production") {
      return true;
    }

    // In development, default to DISABLED for better developer experience
    try {
      const localStorageEnabled =
        localStorage.getItem("enable_security") === "true";
      const envDisabled = process.env.NEXT_PUBLIC_ENABLE_SECURITY === "false";

      // Default to DISABLED in development, unless explicitly enabled
      return localStorageEnabled && !envDisabled;
    } catch {
      return false; // Default to disabled in development if localStorage is not available
    }
  }
}

class SecureApiError extends Error {
  constructor(message, code = "SECURITY_VIOLATION") {
    super(message);
    this.name = "SecureApiError";
    this.code = code;
  }
}

// Secure fetch wrapper
export async function secureFetch(url, options = {}) {
  // Check if security is enabled
  if (!DevToolsDetector.isSecurityEnabled()) {
    console.log("🔓 [SECURITY] Security disabled - API call allowed");
    return fetch(url, options);
  }

  // Check for DevTools
  if (DevToolsDetector.checkDevTools()) {
    console.error("🚫 [SECURITY] DevTools detected - API call blocked");
    throw new SecureApiError(
      "Phát hiện Developer Tools đang mở. Vui lòng đóng DevTools và tải lại trang.",
      "DEVTOOLS_DETECTED"
    );
  }

  // Add security headers
  const secureOptions = {
    ...options,
    headers: {
      ...options.headers,
      "X-Security-Check": "passed",
      "X-Client-Type": "web-app",
      "X-Request-Time": Date.now().toString(),
    },
  };

  try {
    console.log("✅ [SECURITY] Security check passed - Making API call");
    const response = await fetch(url, secureOptions);

    // Additional check after response
    if (DevToolsDetector.checkDevTools()) {
      console.error("🚫 [SECURITY] DevTools detected during API response");
      throw new SecureApiError(
        "Phát hiện Developer Tools trong quá trình xử lý. Vui lòng đóng DevTools.",
        "DEVTOOLS_DETECTED_DURING_RESPONSE"
      );
    }

    return response;
  } catch (error) {
    if (error instanceof SecureApiError) {
      throw error;
    }

    // Re-check DevTools in case of any error
    if (DevToolsDetector.checkDevTools()) {
      throw new SecureApiError(
        "Phát hiện Developer Tools. Không thể thực hiện yêu cầu.",
        "DEVTOOLS_DETECTED_ON_ERROR"
      );
    }

    throw error;
  }
}

// Convenience methods for different HTTP verbs
export const secureApi = {
  get: (url, options = {}) => secureFetch(url, { ...options, method: "GET" }),
  post: (url, data, options = {}) =>
    secureFetch(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    }),
  put: (url, data, options = {}) =>
    secureFetch(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
    }),
  delete: (url, options = {}) =>
    secureFetch(url, { ...options, method: "DELETE" }),
};

export { SecureApiError, DevToolsDetector };
