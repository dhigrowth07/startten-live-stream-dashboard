let env = {};

try {
  // @ts-ignore
  env = import.meta.env || {};
} catch {
  env = {};
}

export const API_URL = env.VITE_PUBLIC_API_URL;

/**
 * Automatically derive SOCKET_URL from API_URL
 * Socket.IO runs on the same host and port as the HTTP server
 * Example: API_URL = "http://localhost:8080/api/v1" -> SOCKET_URL = "http://localhost:8080"
 */
export const SOCKET_URL = (() => {
  if (!API_URL) {
    console.warn("No VITE_PUBLIC_API_URL found, SOCKET_URL will be empty");
    return "";
  }

  try {
    const apiUrl = new URL(API_URL);
    // Extract protocol and host (without path)
    // Socket.IO runs on the same server as the HTTP API
    const derivedSocketUrl = `${apiUrl.protocol}//${apiUrl.host}`;

    // Log in development mode
    if (env.MODE === "development" || !env.MODE) {
      console.log("🔌 Socket.IO URL derived from API URL:", {
        apiUrl: API_URL,
        socketUrl: derivedSocketUrl,
      });
    }

    return derivedSocketUrl;
  } catch (error) {
    console.error("❌ Failed to derive SOCKET_URL from API_URL:", error?.message, {
      apiUrl: API_URL,
    });
    return "";
  }
})();

export function assertEnv() {
  if (!API_URL) {
    throw new Error("Missing VITE_PUBLIC_API_URL — check your .env file!");
  }
}

assertEnv();
