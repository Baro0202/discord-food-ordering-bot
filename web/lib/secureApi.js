// Simple API wrapper for the web app
"use client";

class SecureApiError extends Error {
  constructor(message, code = "API_ERROR") {
    super(message);
    this.name = "SecureApiError";
    this.code = code;
  }
}

// Simple fetch wrapper
export async function secureFetch(url, options = {}) {
  // Add basic headers
  const secureOptions = {
    ...options,
    headers: {
      ...options.headers,
      "X-Client-Type": "web-app",
      "X-Request-Time": Date.now().toString(),
    },
  };

  try {
    console.log("✅ [API] Making API call to:", url);
    const response = await fetch(url, secureOptions);
    return response;
  } catch (error) {
    console.error("❌ [API] Error:", error);
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

export { SecureApiError };
