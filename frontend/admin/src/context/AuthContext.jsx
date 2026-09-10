import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setAdmin(data.admin);
      setSessionError("");
      return data.admin;
    } catch (error) {
      setAdmin(null);
      setSessionError(
        error.response?.status === 401
          ? ""
          : "The admin service could not be reached. Retry your session check.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (alive) {
          setAdmin(data.admin);
          setSessionError("");
        }
      })
      .catch((error) => {
        if (alive) {
          setAdmin(null);
          setSessionError(
            error.response?.status === 401
              ? ""
              : "The admin service could not be reached. Retry your session check.",
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const expired = () => setAdmin(null);
    window.addEventListener("admin-session-expired", expired);
    return () => {
      alive = false;
      window.removeEventListener("admin-session-expired", expired);
    };
  }, []);
  const login = async (username, password) =>
    (await api.post("/auth/login", { username, password })).data;
  const verifyOtp = async (loginId, otp) => {
    const { data } = await api.post("/auth/verify-otp", { loginId, otp });
    setAdmin(data.admin);
    return data;
  };
  const logout = async () => {
    await api.post("/auth/logout");
    setAdmin(null);
  };
  const can = useCallback(
    (permission) =>
      Boolean(
        admin &&
        (admin.role === "super_admin" ||
          admin.permissions?.includes(permission)),
      ),
    [admin],
  );
  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        sessionError,
        login,
        verifyOtp,
        logout,
        refreshMe,
        can,
        isSuper: admin?.role === "super_admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
