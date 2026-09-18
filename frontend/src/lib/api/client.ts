import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT token to every request automatically, if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// If a token expires or is invalid, redirect back to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_email");
      // Full reload (not router.push) is intentional here: this runs outside
      // React's render cycle, and a hard redirect guarantees all in-memory
      // app state is cleared when a session expires. The expired flag lets the
      // login page explain what happened (see login/page.tsx).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login?expired=1";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
