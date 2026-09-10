import axios from "axios";
import { BaseUrl } from "./ApiUrl";
export const api = axios.create({
  baseURL: BaseUrl,
  withCredentials: true,
  timeout: 25000,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !["/auth/login", "/auth/verify-otp", "/auth/me"].includes(
        error.config?.url,
      )
    )
      window.dispatchEvent(new Event("admin-session-expired"));
    return Promise.reject(error);
  },
);
