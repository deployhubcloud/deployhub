/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { api, attachInterceptors } from "../api/apiclient";

const AuthContext = createContext();

const getTokenFromResponse = (data) => data?.AccessToken || data?.accessToken || null;

const normalizeUser = (userData) => {
  if (!userData) return null;

  return {
    ...userData,
    fullName: userData.fullName || userData.fullname || "",
  };
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const accessTokenRef = useRef(null);
  const isLoggingOut = useRef(false);
  const navigate = useNavigate();

  const setToken = useCallback((token) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/user/profile");
      const profile = res.data?.userData || res.data?.data || null;
      setUser(normalizeUser(profile));
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await api.get("/auth/refresh/token");
      const token = getTokenFromResponse(res.data);

      if (!token) throw new Error("No token returned");

      setToken(token);
      await fetchUser();
      return token;
    } catch {
      return null;
    }
  }, [fetchUser, setToken]);

  const logoutClean = useCallback(() => {
    if (isLoggingOut.current) return;

    isLoggingOut.current = true;
    clearAuth();
    navigate("/login", { replace: true });

    window.setTimeout(() => {
      isLoggingOut.current = false;
    }, 1000);
  }, [clearAuth, navigate]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // The local auth state should be cleared even if the server session is already gone.
    }

    logoutClean();
  }, [logoutClean]);

  useEffect(() => {
    const init = async () => {
      if (!accessTokenRef.current) {
        await refreshAccessToken();
      }

      setIsAuthReady(true);
    };

    init();
  }, [refreshAccessToken]);

  useEffect(() => {
    const eject = attachInterceptors(
      () => accessTokenRef.current,
      refreshAccessToken,
      logoutClean
    );

    return eject;
  }, [refreshAccessToken, logoutClean]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const token = getTokenFromResponse(res.data);

    if (!token) throw new Error("Login failed");

    setToken(token);
    await fetchUser();
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(accessToken),
        isAuthReady,
        user,
        fetchUser,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
